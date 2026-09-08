> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "安全地更新 OpenClaw(全局安装或源码安装),以及回滚策略"
read_when:
  - 更新 OpenClaw
  - 更新后出现故障
title: "更新"
---

保持 OpenClaw 处于最新版本。

关于 Docker、Podman 和 Kubernetes 的镜像替换,参见[升级容器镜像](/install/docker#upgrading-container-images)。Gateway 会在进入就绪状态之前完成启动安全的升级工作;如果挂载的状态需要手动修复,则会直接退出。

在进行重大更新之前,请先[创建一个经过验证的备份](#before-updating-create-a-verified-backup)。自动生成的配置副本和迁移恢复原件并不等于完整状态备份。

## 推荐方式:`openclaw update`

自动检测你的安装方式(npm、pnpm、Bun 或 git),在旧 Gateway 继续服务的同时校验候选版本,然后激活并验证更新。

```bash
openclaw update
```

如果目标就是已安装的包版本或 Git 目标 SHA,则会以 `skipped` / `already-current` 结束,不会停止或重启 Gateway。显式指定的 `--channel` 仍会被保存为更新通道。对于支持候选版本校验的目标,Doctor 检查、配置与插件规划,以及基于状态副本的金丝雀启动,都会在服务停止之前完成。第一个激活窗口包含切换、必要的迁移和服务启动。插件包在核心 Gateway 继续服务期间下载并同步。如果插件快照发生了变化,则需要第二个经过计时的激活窗口,在独占维护状态下完成完整的 Doctor 迁移、重启和验证。未发生变化的插件不会再次执行完整的 Doctor 流程。最终报告会记录停机时间和验证结果。各项检查详见[验证与激活](/cli/update#validation-and-activation)。

包更新还会在停止正在服务的 Gateway 或替换已安装核心之前,检查已启用的已配置插件在 npm 上的可用性。注册表目标会被尽早检查;显式指定的包工件则会在演练、实时状态准备或激活之前,使用私有暂存的包版本进行检查。该检查使用与更新后同步相同的插件版本规则,包括发布批次(release-cohort)跟踪、beta 选择和 extended-stable 目标。如果版本缺失或注册表出错,更新会以 `plugin-target-unavailable` 拒绝执行;针对注册表目标的 `--dry-run` 也会报告同样的拒绝。对于显式指定的包工件,`--dry-run` 不会暂存该包,并报告插件可用性检查仍未完成。可以等注册表或镜像恢复可用后重试,用 `openclaw update --tag <version>` 选择一个较旧的可用核心版本,或者先禁用受影响的插件再重试。extended-stable 不接受 `--tag`;请稍后重试或显式切换通道。内置插件和以路径方式安装的插件无需请求注册表。这个元数据检查不会预留下载,因此后续下载失败仍可能需要恢复操作。

切换通道或指定具体版本:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 预览,不实际应用
```

`openclaw update` 没有 `--verbose` 标志(安装器才有)。诊断时可以使用 `--dry-run` 预览计划执行的操作,用 `--json` 获取结构化结果,或用 `openclaw update status --json` 查看通道与可用性状态。

`--channel beta` 会按语义化版本顺序从 npm 的 beta 和 latest dist-tag 中选择最新版本。如果只想做一次性的包更新并固定使用原始的 npm beta dist-tag,请改用 `--tag beta`。

已保存的 `update.channel` 仍是后续更新、自动检查和更新状态查询所使用的通道。例如,在已保存为 stable 通道的情况下做一次性的 beta 包更新,之后仍会继续检查 stable。要订阅 beta 更新,请使用 `--channel beta`。为满足兼容性要求,插件仍会跟随已安装核心的版本。

`--channel extended-stable` 仅适用于包安装,且安装仍仅在前台进行。OpenClaw 读取公开的 npm `extended-stable` 选择器,校验所选的确切包,并安装该确切版本。如果注册表数据缺失或不一致,则直接失败;它绝不会回退到 `latest`。如果所选版本比已安装版本更旧,仍会执行常规的降级确认。CLI 会在核心更新成功后保存该通道;直接执行 `npm install -g openclaw@extended-stable --allow-scripts=openclaw` 不会更新 `update.channel`,但最终的 extended-stable 包版本在检查更新可用性时,仍只使用经过校验的 `extended-stable` 选择器。上述直接命令适用于 npm 12 或 npm 11.16+。在 npm 11.15 及更早版本上,请省略 `--allow-scripts=openclaw`。核心切换完成后,具有裸/默认或 `latest` 意图且符合条件的官方 npm 插件和受信任的官方 ClawHub 插件会收敛到该确切核心版本。精确固定版本、显式的非 `latest` 标签、第三方插件、自定义注册表以及其他来源保持不变。当核心是修正发布(correction release)时,与版本绑定的运行时插件会收敛到基础发布批次(例如 `YYYY.M.P-2` 使用插件 `YYYY.M.P`)。由当前版本的 OpenClaw 创建的目录安装会保留该默认意图。仅包含确切版本的旧记录会保持固定,因为 OpenClaw 无法安全区分旧的自动固定与用户手动固定。对于 npm 安装,在 extended-stable 通道上运行一次 `openclaw plugins update @openclaw/name`,即可让该插件重新加入核心精确版本跟踪。

`--channel dev` 会为 npm 管理的包安装和现有的 Git 检出提供一个持久跟随 GitHub `main` 的检出。包安装会拒绝 `--tag main` 这种简写,因为工作区检出并不是一个自包含的包工件。请使用 `openclaw update --channel dev` 切换到受支持的检出与构建流程。其他显式指定的包规格仍保持其包管理器行为。

beta 通道上受管的 npm 插件使用同样的“beta/latest 取最新”选择逻辑,包括 `@openclaw/codex` 等官方插件。较旧的 beta 标签不会把插件拖在当前稳定版之后。启动修复会让已是最新版本的包保持原样,因此一次无实际变化的刷新不需要再次重启。

通道语义详见[发布通道](/install/development-channels)。

### 从 2026.9.2 更新并跨越 schema 升级

由 OpenClaw 2026.9.2 驱动的更新可以正常跨越共享状态的 schema 升级。目标版本会在保留旧发布 schema 版本的同时应用迁移内容,这样旧版更新器就能完成其台账(ledger)写入和最终报告。Doctor 会说明 schema 内容已应用、版本发布被推迟。在此期间,新 Gateway 运行在迁移后的内容之上。

发布操作会等待每个受影响的更新运行都终止至少五分钟。一条超过 30 分钟没有变化的运行记录,仅就发布而言会被视为已放弃;这并不会把一条无身份标识的更新历史记录终止化。Gateway 监视器会在期限之后执行发布;之后打开数据库也可能触发发布。精确的时序和残留的旧 CLI 限制参见[数据库 schema](/reference/database-schemas#schema-bumps-and-older-updaters)。

如果 agent 数据库也需要迁移、必需的状态元数据缺失,或状态内容迁移失败,Doctor 会改为报告 `update-schema-bump-unfenced`,并附上数据库版本和手动更新命令。请让失败的更新先完成对上一个包的恢复。OpenClaw 2026.9.2 在安装后验证失败时会让 Gateway 服务保持停止状态。请在 Gateway 之外的 shell 中执行手动更新,并将 `<target>` 替换为拒绝信息中给出的确切目标版本:

```bash
openclaw gateway stop
npm install -g openclaw@<target> --allow-scripts=openclaw
openclaw doctor --fix
openclaw gateway start
```

每条命令都必须等上一条成功后再执行。在 npm 11.15 及更早版本上,请省略 `--allow-scripts=openclaw`。对于 pnpm 管理的安装,请把安装命令替换为 `pnpm add -g --allow-build=openclaw openclaw@<target>`;对于 Bun,请使用 `bun add -g --trust openclaw@<target>`。

同 schema 的更新、更早的无台账更新器(如 2026.9.1),以及 2026.9.3 起的围栏式事务更新器,均保持其原有行为。该回退方案不会撤销先前的迁移;如果数据库已经比恢复后的包更新,请安装一个兼容的目标版本并完成 Doctor,然后再启动 Gateway。

### 从聊天发起更新

OpenClaw 的所有者可以直接说 "update"(agent 会使用 `gateway` 动作 `update.run`),或发送 `/update`。候选版本会在旧 Gateway 继续服务的同时完成校验,已是最新版本的更新不会重启 Gateway。随着 Gateway 依次观察到各记录节点,更新运行可以在该聊天中发送以下通知:

1. 更新被接受时的确认回执。
2. 当激活被记录且 Gateway 即将停止时:`⏳ Restarting the gateway now (v<from> → v<to>)…`
3. 当新 Gateway 开始验证时:`🔁 Back on v<to>, verifying…`
4. 最终报告,包括更新成功的情形。

由 systemd 或 launchd 管理的更新可能会在中间通知送达之前就停止 Gateway。对这类安装,不保证完整的四条消息序列;持久化的运行报告在重新连接后仍可查看。

源自内部会话的运行(包括 Control UI 和 webchat)会直接在该会话的记录中收到这些通知。只需传入 `sessionKey` 即可,调用方无需提供 `deliveryContext`。在停止受管服务之前,更新器会等待正在服务的 Gateway 完成其重启通知的发送尝试。该等待最长 10 秒,以免卡住的通知阻塞激活。

报告包含结果、各阶段记录的耗时、失败的步骤、验证事实,以及必要时的下一步操作。每次运行中每条通知至多发送一次;在重启之前就中止的更新只会发送其已到达阶段的通知。如果更新无法启动,机器人会记录并说明原因,并在有可用的手动命令时一并提供。

聊天、CLI、Control UI 和自动更新共享同一个持久的运行 ID。使用 `openclaw update status` 可读取当前活动或最近一次的报告,重启之后也可以;`--json` 会给出 `activeRun` 和 `lastRun` 记录。Gateway 历史查询详见[运行历史与报告](/cli/update#run-history-and-reports)。

发送者必须在 [`commands.ownerAllowFrom`](/tools/slash-commands#configuration) 中。`/update` 还要求启用 `commands.restart`(默认已启用)。agent 绝不能在聊天 shell 中运行 `npm install -g openclaw` 或停止 Gateway 服务;请使用更新动作,以保证重启与通知保持协调。

## 过期的更新历史

如果 Gateway 运行正常,但更新状态一直停留在进行中,请先确认没有更新仍在运行。在已更新的安装上执行:

```bash
openclaw update repair
openclaw update status
```

对于超过 30 分钟的非活动旧记录,repair 会校验正在运行的 Gateway 与已安装的版本和构建一致,然后在无需维护或重启服务的情况下清除这条过期运行。一次新的显式 `openclaw update` 也可以取代单条过期的无身份标识记录。较新的记录和已记录的活动驱动会受到保护。无身份标识的记录永远不会被自动清除;Control UI 的配置写入挂起会在对账完成后解除。

OpenClaw 2026.9.2 不会因为存在一条更旧的运行中记录而拒绝新的 CLI 更新:它的[准入路径](https://github.com/openclaw/openclaw/blob/v2026.9.2/src/cli/update-cli/update-command-run.ts#L77)会创建新的运行,而它的[台账](https://github.com/openclaw/openclaw/blob/v2026.9.2/src/infra/update-run-ledger.ts#L250)只检查重复的运行 ID。正常升级即可;如果旧历史仍然残留,再使用更新后的 `openclaw update repair`。这个台账缺陷不需要借助包管理器手段绕过。参见[更新运行历史](/cli/update#run-history-and-reports)。

## 清退更新恢复数据

确认更新和会话都没有问题后,先预览保留的迁移原件:

```bash
openclaw update cleanup --dry-run
```

请使用与更新时相同的 profile 和 state/config 覆盖参数,并核对报告中打印的状态目录。仅涉及元数据的预览可以在 Gateway 运行时执行。要实际执行,请自行停止该 Gateway,等待其他 SQLite 维护完成,并停止数据库读取方(如会话列表监视器)。在 `openclaw update cleanup` 退出之前,保持它们处于停止状态;只读连接也可能改动 WAL/SHM 边车文件并使验证失效。清理操作绝不会停止或重启 Gateway。确认提示默认为 **No**;自动化脚本必须显式传入 `--yes`,使用 `--json` 时也不例外。

清理会永久放弃回退到符合条件的原件的能力,包括修复过的分支和旧的 provider 元数据。当前的 SQLite 历史、操作者备份,以及受保护或未知的工件会保留。它不能替代[更新前的备份](#before-updating-create-a-verified-backup)。资格条件、JSON 输出以及恢复被中断的删除,参见[更新清理](/cli/update#update-cleanup)。私有包、命令 shim 和 Git 运行时备份仍归更新事务所有,不在这次迁移清理的范围之内。更新历史中一条被中断的记录不会阻碍对其他符合条件迁移归档的清理。

## 在 npm 和 git 安装之间切换

由安装器驱动的切换会在退役当前生效的安装方之前先校验替换内容。源码包装器以原子方式发布;同路径的 npm shim 切换会使用经过身份校验的备份,失败时恢复原状,因此失败的候选版本不会让原有命令失效。`openclaw update` 命令只有在核心后收敛以及所请求的重启健康检查都成功之后,才会输出最终的成功结果。

候选版本校验失败时,旧 Gateway 继续服务。激活之后,只有当共享数据库和受影响的既有 per-agent 数据库的 schema 版本都没有变化,且配置自候选版本的激活 Doctor 流程以来没有改变时,包恢复才能还原保留的先前包。由候选版本首次创建的数据库,仅在其所支持的那个数据库类型对应的 schema 版本上才是中性的。恢复后的 Gateway 必须通过同样的运行时检查,恢复才会被报告为完成。schema 迁移会阻止自动包回滚;替换代码无法撤销已迁移的状态。未完成的文件回滚会保留其备份以供检查。参见[自动回滚](/install/updating#automatic-schema-neutral-rollback)。如果较旧的目标不支持保留服务定义,自动恢复会停止并报告错误,不会用更弱的选项重试。请修复报告的故障,重新运行 `openclaw update`,并检查 `openclaw gateway status --deep`。参见[失败更新的恢复](/gateway/restart-recovery#recovery-after-a-failed-update)。

在 macOS 上,如果更新中断后 Doctor 报告存在一个已安装但未加载且被禁用的 Gateway LaunchAgent,请先完成更新验证或 Doctor 及其问题排查。然后使用打印出来的 `openclaw gateway start` 命令,并保留其中的 profile、state/config 或自定义标签覆盖参数。`doctor --fix` 会诊断被禁用的标签,但已停止的 Gateway 仍会保持停止状态。

可以通过通道来切换安装类型。更新器会把你的状态、配置、凭据和工作区都保留在 `~/.openclaw` 中;它只会改变 CLI 和 gateway 所使用的 OpenClaw 代码安装。

> 注:篇幅所限仅译核心章节,完整内容见原项目。
