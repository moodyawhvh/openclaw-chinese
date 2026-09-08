> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "auth profile 的凭据资格判定与解析的权威语义"
title: "身份验证凭据语义"
read_when:
  - 处理 auth profile 解析或凭据路由时
  - 调试模型身份验证失败或 profile 顺序时
---

这些语义确保选择阶段与运行时的身份验证行为保持一致。它们被以下组件共用:

- `resolveAuthProfileOrder`(profile 排序)
- `resolveApiKeyForProfile`(运行时凭据解析)
- `openclaw models status --probe`
- `openclaw doctor` 的 auth 检查(`doctor-auth`)

## 稳定的探测原因码

探测结果会携带一个 `status` 分类(`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`);当探测根本未发起模型调用时,还会附带一个稳定的 `reasonCode`:

| `reasonCode`             | 含义                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| `excluded_by_auth_order` | 该 profile 被其所属 provider 的显式 auth 顺序排除在外。                    |
| `missing_credential`     | 未配置内联凭据或 SecretRef。                                               |
| `expired`                | 令牌的 `expires` 时间已过。                                                |
| `invalid_expires`        | `expires` 不是有效的正数 Unix 毫秒时间戳。                                 |
| `unresolved_ref`         | 已配置的 SecretRef 无法解析。                                              |
| `ineligible_profile`     | profile 与 provider 配置不兼容(包括格式非法的密钥输入)。                   |
| `no_model`               | 凭据存在,但没有解析出可探测的模型候选。                                    |

资格检查对可用的凭据报告 `ok` 作为原因码。

## Token 凭据

Token 凭据(`type: "token"`)支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 与 `tokenRef` 均缺失时,该 token profile 不具备资格(`missing_credential`)。
2. `expires` 是可选的。若提供,它必须是一个有限的 Unix 纪元毫秒数,大于 `0`,且不超过 JavaScript `Date` 的最大时间戳(8640000000000000)。
3. 如果 `expires` 非法(类型错误、`NaN`、`0`、负数、非有限值或超出该最大值),该 profile 不具备资格,原因为 `invalid_expires`。
4. 如果 `expires` 已成过去,该 profile 不具备资格,原因为 `expired`。
5. `tokenRef` 不能绕过 `expires` 校验。

### 解析规则

1. 解析器对 `expires` 的语义与资格语义一致。
2. 对具备资格的 profile,令牌材料可以从内联值或 `tokenRef` 解析得到。
3. 无法解析的 ref 会在 `models status --probe` 输出中产生 `unresolved_ref`。

## Agent 副本可移植性

Agent 的 auth 继承是读取穿透式的。当某个 agent 没有本地 profile 时,它会在运行时从共享 auth 存储解析 profile,而不会把密钥材料复制进自己的凭据存储(`agents/<agentId>/agent/openclaw-agent.sqlite`)。在 `openclaw doctor --fix` 完成一次性迁移之后,共享存储位于 `state/openclaw.sqlite`。在此之前,doctor 会报告遗留的 `agents/main/agent/openclaw-agent.sqlite` 属主,并且该 agent 无法删除。

显式复制流程(例如 `openclaw agents add`)遵循以下可移植性策略:

- `api_key` 与 `token` profile 可移植,除非设置 `copyToAgents: false`。
- `oauth` profile 默认不可移植,因为刷新令牌可能是一次性的或对轮换敏感。
- provider 自有的 OAuth 流程可以在已知跨 agent 复制刷新材料安全的前提下,通过 `copyToAgents: true` 选择加入;该选择仅在 profile 携带内联 access/refresh 材料时生效。

不可移植的 profile 仍可通过共享的读取穿透基础使用,除非目标 agent 单独登录并创建自己的本地 profile。

`openclaw agent exec` 在切换到临时运行状态时会保留原始的共享存储根目录。其受限的凭据作用域会从该共享存储读取可移植的 `api_key` 与 `token` profile,而不持久化副本;所配置 agent 的本地 profile 仍然优先。共享 OAuth profile 被排除在该临时作用域之外,即使设置了 `copyToAgents: true` 也是如此,这样运行过程就不会获得另一个刷新属主。`--auth-env-only` 会完全禁用对已存储凭据的访问。

显式选择状态目录的 auth 写入(包括隔离的 QA 暂存)会使用该目录的共享存储进行属主判定与 OAuth 去重。其运行时发布与回滚保持同一属主;其他进程本地的状态根不作为继承基础。无关的外层数据库可以更旧、更新或不可读,都不会阻塞隔离写入;但所选目标中不可读或更新的数据库仍会导致写入以失败收场。未显式指定状态目录的写入保持常规的环境状态与 agent 目录配置。

## 个人模型账户

从 **Settings → Profile → Connected accounts** 连接的账户在共享状态数据库中拥有一个按身份划分的属主。它们的凭据与使用状态绝不会进入共享或 agent 本地的 auth 存储、外部 CLI 镜像或全局运行时快照。运行时最多加载其会话所选定的那一个个人凭据。未关联的个人账户仍可被既有的会话固定(session pin)使用,但不会被自动选择用于新的会话。

个人固定沿用既有的同 provider 故障转移策略:被固定的账户失败后,可按顺序尝试共享账户。它们不会把另一个人的个人账户当作回退。重新连接只能替换连接者本人的凭据;由管理员创建的关联所引用的共享凭据不属于个人财产。参见[按人划分的模型账户](/concepts/multi-user#per-person-model-accounts)。

## 仅配置式的 auth 路由

带有 `mode: "aws-sdk"` 的 `auth.profiles` 条目是路由元数据,而不是已存储的凭据。当目标 provider 使用 `models.providers.<id>.auth: "aws-sdk"`(即插件自有的 Amazon Bedrock 安装流程所写入的路由)时,这些条目是有效的。即使凭据存储中不存在匹配条目,这些 profile id 也可以出现在 `auth.order` 和会话覆盖中。

不要把 `type: "aws-sdk"` 写入凭据存储;已存储的凭据只能是 `api_key`、`token` 或 `oauth`。如果旧版 `auth-profiles.json` 中存在这样的标记,`openclaw doctor --fix` 会把它移到 `auth.profiles`,并从存储中移除该标记。

当被选中的已存储 profile 被移除时,凭据范围的模型发现会在查询动态模型元数据之前报告 `selected_auth_profile_unavailable`。请恢复凭据或选择另一个已配置的 profile;注册模型并不能修复缺失的身份验证。仅配置式的 AWS SDK profile 在没有已存储凭据时仍然有效。当其凭据消失时,聊天准入与 agent 命令仍会保留显式的同 provider 选择,以便身份验证能够报告恢复情况。过期的自动选择以及指向不兼容 provider 的选择仍会被清除。

## 显式 auth 顺序过滤

- 当为某个 provider 设置了 `auth.order.<provider>` 或 auth 存储的顺序覆盖时,`models status --probe` 只探测在该 provider 已解析 auth 顺序中仍然保留的 profile id。已存储的覆盖优先于 `auth.order` 配置。
- 该 provider 的某个已存储 profile 若被显式顺序省略,不会在之后被静默尝试。探测输出会以 `reasonCode: excluded_by_auth_order` 及详情 `Excluded by auth.order for this provider.` 报告它。
- 有效的会话用户固定是一个显式的按会话例外:即使该 profile 被排除在 provider 顺序之外,OpenClaw 也会先尝试它,然后使用按序排列的同 provider profile 作为重试候选。冷却或禁用窗口仅作用于受影响的 profile,不会抑制其具备资格的同级 profile。

已准备的 agent 请求使用其自身选定的插件元数据、配置、工作区和环境来进行 auth profile 资格判定、排序以及环境凭据取证。空的选择插件集仍然是权威的;其他请求的插件别名无法添加 profile 或更改凭据属主。

## 模型目录发现

模型发现的已存储 profile 选择遵循权威的 auth 顺序与资格规则。仅限单个模型的冷却不会抑制账户级的目录发现。已配置的订阅模式仍附着于直接凭据,而成功的 OAuth 准备会把解析出的当前令牌提供给其目录消费方,而不是被捕获存储中的旧令牌。

基于环境的 profile 会保留来自发现环境的可用值,包括冷启动命令与工作进程路径。当这些材料缺失时,只有所选 profile 的已激活快照可以提供它们;否则发现流程会在发起目录 HTTP 请求之前报告 `unavailable`。引用名称绝不会作为凭据发送,也不会被另一个 profile 的凭据替换。在 Gateway 上,请先恢复密钥并运行 `openclaw secrets reload`,再重试发现。

当所有具备资格的 OAuth 候选的准备都失败时,发现流程会报告 `unavailable` 并附带已尝试的 profile 标识,而不是把该 provider 视为未配置。兼容的既有清单仍然可用。可用的回退凭据仍会提供自己的目录结果。

当目录截止时间到期后,迟到的 provider 结果会在最终化之前被丢弃。已经开始的钩子或 OAuth 刷新可以继续完成(包括持久化已轮换的凭据),但无法向已过期的目录运行发布结果。

面向 API key 的与完整 auth 的目录回调保留其既有的来源优先级。插件必须保证凭据字节与其 auth 模式来自同一次选择。目录失败与恢复遵循[模型清单契约](/concepts/models#selection-source-and-fallback-strictness);它们不会改变消息执行的 profile 轮换或会话固定。

## 探测目标解析

- 探测目标可以来自 auth profile、环境凭据或 `models.json`(结果的 `source`:`profile`、`env`、`models.json`)。
- 如果某个 provider 拥有凭据,但 OpenClaw 无法为其解析出可探测的模型候选,`models status --probe` 会报告 `status: no_model` 与 `reasonCode: no_model`。

## 外部 CLI 凭据发现

- 仅归外部 CLI 所有的运行时凭据(`claude-cli` 对应 Claude CLI、`openai` 对应 Codex CLI、`minimax-portal` 对应 MiniMax CLI)只有在相关 provider、运行时或 auth profile 处于当前操作范围之内,或者该外部来源的已存储本地 profile 已经存在时,才会被发现。
- auth 存储的调用方会选择一个显式的外部 CLI 发现模式:`none` 表示仅限持久化/插件 auth,`existing` 表示刷新已存储的外部 CLI profile,`scoped` 表示针对具体的 provider/profile 集合。
- 只读/状态路径传入 `allowKeychainPrompt: false`;它们只使用基于文件的外部 CLI 凭据,不读取也不复用 macOS Keychain 的结果。
- `/models` 会复用已与其目录一同准备好的外部登录证据,因此这些 provider 无需再次 OpenClaw 登录即可保持可见。打开默认菜单不会重复外部 CLI 发现;显式 auth 顺序与路由兼容性规则仍然适用。

## OAuth SecretRef 策略守卫

SecretRef 输入仅用于静态凭据。OAuth 凭据在运行时是可变的(刷新流程会持久化轮换后的令牌),因此以 SecretRef 为基础的 OAuth 材料会把可变状态分散到多个存储中。

- 如果 profile 凭据为 `type: "oauth"`,则该 profile 的任何凭据材料字段都会拒绝 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`,则该 profile 的 SecretRef 形式的 `keyRef`/`tokenRef` 输入会被拒绝。
- 违规属于硬失败(抛出错误),出现在启动/重载的密钥准备与 profile 解析路径中。

## 兼容旧版的消息格式

为了脚本兼容性,探测错误的第一行保持不变:

`Auth profile credentials are missing or expired.`

随后的各行是人类可读的详情与稳定的原因码,格式为 `↳ Auth reason [code]: ...`。

## 相关文档

- [密钥管理](/gateway/secrets)
- [auth 存储](/concepts/oauth)

> 注:篇幅所限仅译核心章节,完整内容见原项目。
