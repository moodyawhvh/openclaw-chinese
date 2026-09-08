> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "常见问题:快速上手与首次运行配置 —— 安装、引导、认证、订阅与常见初始故障"
read_when:
  - 全新安装、引导流程卡住或首次运行报错
  - 选择认证方式与提供商订阅方案
  - 无法访问 docs.openclaw.ai、无法打开 dashboard、安装卡住
title: "常见问题:首次运行配置"
sidebarTitle: "首次运行 FAQ"
---

快速上手与首次运行的问答。日常操作、模型、认证、会话与故障排查请参阅主
[FAQ](/help/faq)。

## 快速上手与首次运行配置

<AccordionGroup>
  <Accordion title="安装和配置 OpenClaw 的推荐方式">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    安装器会自动为你启动引导式 onboarding,因此不需要单独运行 onboarding 命令。onboarding 完成后,按 **Ctrl+C** 停止前台 Gateway,然后安装后台服务:

    ```bash
    openclaw gateway install
    ```

    想用一条命令同时完成经典分步向导和服务安装?请运行 `openclaw onboard --install-daemon` 代替上面两条命令。该标志会选择经典流程,因此你不会看到引导式的 **Quick start** 与 **Custom setup** 选择界面。

    从源码安装(贡献者/开发者):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    还没有全局安装?请改用 `pnpm openclaw onboard`。如果 Control UI 资源缺失,onboarding 会尝试自行构建,失败时回退到 `pnpm ui:build`。

  </Accordion>

<a id="i-am-stuck" />

  <Accordion title="我卡住了,最快的脱困方法">
    使用一个能**看到你机器**的本地 AI 代理。大多数"我卡住了"的情况都是远程协助者无法检查的**本地配置或环境问题**,所以这比去 Discord 提问更管用。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    通过可修改的(git)安装方式把完整源码交给该代理,让它能阅读代码和文档,并针对你实际运行的版本进行推理:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    让代理逐步规划并监督修复过程,只执行必要的命令 —— 改动越小越容易审查。

    在 Discord 或 GitHub issue 中求助时,请附上以下命令的输出:

    | 命令 | 作用 |
    | --- | --- |
    | `openclaw status` | Gateway/代理健康状态 + 基础配置快照 |
    | `openclaw status --all` | 完整只读诊断,可直接粘贴 |
    | `openclaw models status` | 提供商认证 + 模型可用性 |
    | `openclaw doctor` | 校验并修复常见的配置/状态问题 |
    | `openclaw logs --follow` | 实时日志跟踪 |
    | `openclaw gateway status --deep` | Gateway/配置/插件深度健康检查 |
    | `openclaw health --verbose` | 详细健康报告 |

    发现了真正的 bug 或有修复方案?提交 issue 或发送 PR:
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls)。

    快速调试:[出问题后的前 60 秒](/help/faq#first-60-seconds-if-something-is-broken)。
    安装文档:[Install](/install)、[安装器标志](/install/installer)、[更新](/install/updating)。

  </Accordion>

  <Accordion title="onboarding 完成后如何打开 dashboard?">
    onboarding 会在配置完成后立即在浏览器中打开一个干净(不带 token)的 dashboard URL,并在摘要中打印该链接。请保持那个标签页打开;如果浏览器没有自动启动,在同一台机器上手动复制/粘贴打印出的 URL 即可。
  </Accordion>

  <Accordion title="dashboard 在 localhost 与远程环境下分别如何认证?">
    **本机(localhost):**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果要求共享密钥认证,请在 Control UI 设置中粘贴已配置的 token 或密码。
    - Token 来源:`gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
    - 密码来源:`gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。
    - 还没有配置共享密钥?运行 `openclaw doctor --generate-gateway-token`(或 `openclaw doctor --fix --generate-gateway-token`)。

    **非 localhost 环境:**

    - **Tailscale Serve**(推荐):保持绑定 loopback,运行 `openclaw gateway --tailscale serve`,然后打开 `https://<magicdns>/`。设置 `gateway.auth.allowTailscale: true` 后,身份头即可满足 Control UI/WebSocket 认证(无需粘贴共享密钥,前提是 Gateway 主机可信);HTTP API 仍需共享密钥认证,除非你刻意使用 private-ingress `none` 或可信代理 HTTP 认证。
      同一客户端的并发坏认证 Serve 尝试会先被串行化,再由认证失败限制器记录,因此第二次错误重试就可能显示 `retry later`。
    - **具备身份识别的反向代理**:把 Gateway 放在可信代理之后,设置 `gateway.auth.mode: "trusted-proxy"`,然后打开代理 URL。同机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback: true`。
    - **SSH 隧道**:`ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`,然后打开 `http://127.0.0.1:18789/`。隧道之上仍适用共享密钥认证;如果提示,请粘贴已配置的 token 或密码。

    绑定模式与认证细节见 [Dashboard](/web/dashboard) 和 [Web surfaces](/web)。

  </Accordion>

  <Accordion title="Heartbeat 一直在跳过,这些跳过原因是什么意思?">
    | 跳过原因 | 含义 |
    | --- | --- |
    | `quiet-hours` | 不在配置的活动时间窗口内 |
    | `empty-heartbeat-file` | Heartbeat 监控草稿文件存在,但里面只有空白、注释、标题、围栏或空清单等占位内容 |
    | `alerts-disabled` | 所有 heartbeat 可见性均已关闭(`showOk`、`showAlerts` 和 `useIndicator` 全部禁用) |

    旧版 heartbeat `tasks:` 块可通过 `openclaw doctor --fix` 迁移为独立调度的 cron 任务。

    文档:[Heartbeat](/gateway/heartbeat)、[Automation](/automation)。

  </Accordion>

  <Accordion title="为什么聊天审批有两套 exec approval 配置?">
    它们控制的是不同层面:

    - `approvals.exec` —— 将审批提示转发到聊天目的地。
    - `channels.<channel>.execApprovals` —— 让该频道成为 exec approval 的原生审批客户端。

    主机侧的 exec 策略仍然是真正的审批闸门;聊天配置只决定审批提示出现在哪里以及人们如何回应。

    通常你不需要两者同时使用:

    - 如果聊天本身已支持命令和回复,同聊天内的 `/approve` 会走共享路径。
    - 对于支持的原生客户端,设置 `channels.<channel>.execApprovals.enabled: "auto"` 或 `true`,并配置审批人或该频道支持的 owner 身份。Discord 和 Slack 需要显式启用;Telegram 未设置时按 `"auto"` 处理。
    - 当原生审批卡片/按钮可用时,以该 UI 为主;只有当工具结果提示聊天审批不可用时,才需要提及手动 `/approve` 命令。
    - 只有当审批提示还需要送达其他聊天或专门的运维群组时,才使用 `approvals.exec`。
    - 只有当你希望审批提示回发到发起请求的房间/话题时,才设置 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批是独立的:默认为同聊天内 `/approve`,可选 `approvals.plugin` 转发,且只有部分原生频道对这些也保留原生处理。

    简言之:转发用于路由,原生客户端配置用于更丰富的频道专属体验。
    参见 [Exec Approvals](/tools/exec-approvals)。

  </Accordion>

  <Accordion title="需要什么运行时?">
    Node **24.16+** 或 **26.1+** 是主要且默认的运行时(推荐 Node 26)。`pnpm` 是本仓库的包管理器。
    使用 WAL 重置安全的 `node:sqlite` 构建的 Bun 1.4+,可作为显式选项运行 CLI、Gateway 和受管 Node 主机。
  </Accordion>

  <Accordion title="能在 Raspberry Pi 上运行吗?">
    可以,但先看内存:Pi 5 和 Pi 4(2 GB+)是最佳选择;Pi 3B+(1 GB)能跑但很慢;Pi Zero 2 W(512 MB)不推荐。

    | 型号 | 内存 | 适配程度 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 最佳 |
    | Pi 4 | 4 GB | 良好 |
    | Pi 4 | 2 GB | 尚可,建议加 swap |
    | Pi 4 | 1 GB | 勉强 |
    | Pi 3B+ | 1 GB | 缓慢 |
    | Pi Zero 2 W | 512 MB | 不推荐 |

    绝对最低要求:1 GB 内存、1 核、500 MB 可用磁盘、64 位系统。由于 Pi 只运行 Gateway(模型调用走云端 API),即使配置一般的 Pi 也能承受负载。

    小型 Pi/VPS 也可以只承载 Gateway,同时在你的笔记本/手机上配对 **nodes**,用于本地屏幕/摄像头或命令执行。配对的 Mac 还能在其原生面板中展示托管 widgets。参见 [Nodes](/nodes)。

    完整安装流程:[Raspberry Pi](/install/raspberry-pi)。

  </Accordion>

  <Accordion title="在 Raspberry Pi 上安装有什么技巧?">
    - 使用 **64 位**系统;不要用 32 位的 Raspberry Pi OS。
    - 2 GB 及以下内存的板子请加 swap。
    - 出于性能和寿命考虑,优先选择 **USB SSD** 而不是 SD 卡。
    - 优先使用可修改的(git)安装方式,方便查看日志和快速更新。
    - 先不带 channels/skills 启动,再逐个添加。
    - 奇怪的二进制执行失败("exec format error")通常是某个可选 skill 工具缺少 ARM64 构建。

    完整指南:[Raspberry Pi](/install/raspberry-pi)。另见 [Linux](/platforms/linux)。

  </Accordion>

  <Accordion title="卡在 wake up my friend / onboarding 无法孵化,怎么办?">
    该界面依赖 Gateway 可达且已完成认证。在配置了模型提供商的情况下,TUI 首次孵化时也会自动发送"Wake up, my friend!"。如果你跳过了模型/认证配置,onboarding 会显示"Model auth missing"提示并直接打开 TUI 而不发送任何内容 —— 重新运行 `openclaw onboard` 添加提供商即可。
    这也是修改模型提供商或其认证的唯一命令。
    如果你看到了 wake-up 那行字但**没有任何回复**、token 数保持为 0,说明代理根本没有运行。

    1. 重启 Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态和认证:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 还是卡住?运行:

    ```bash
    openclaw doctor
    ```

    如果 Gateway 在远程,请确认隧道/Tailscale 连接正常,且 UI 指向正确的 Gateway。参见 [Remote access](/gateway/remote)。

  </Accordion>

  <Accordion title="能否把现有配置迁移到新机器而不用重做 onboarding?">
    可以。复制**状态目录**和**工作区**,然后运行一次 Doctor:

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`(默认:`~/.openclaw`)。
    3. 复制你的工作区(默认:`~/.openclaw/workspace`)。
    4. 运行 `openclaw doctor`,然后重启 Gateway 服务。

    这样可以保留配置、auth profile、WhatsApp 凭据、会话和记忆 —— 只要**两处**都复制,你的 bot 就会保持原样。在远程模式下,session store 和 workspace 由 Gateway 主机持有。

    **重要:**如果你只是把工作区 commit/push 到 GitHub,备份到的只有**记忆 + bootstrap 文件**,不包含会话历史和认证信息。它们存放在
    `~/.openclaw/` 下(例如 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`)。

    相关内容:[Migrating](/install/migrating)、[磁盘上的文件分布](/help/faq#where-things-live-on-disk)、
    [Agent workspace](/concepts/agent-workspace)、[Doctor](/gateway/doctor)、
    [Remote mode](/gateway/remote)。

  </Accordion>

  <Accordion title="在哪里查看最新版本的新变化?">
    查看 GitHub changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目在最上方。如果最顶部的分区是 **Unreleased**,则下一个带日期的分区就是最新发布版本。条目按 **Highlights**、**Changes** 和 **Fixes** 分组(必要时还有 docs/其他分区)。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai(SSL 错误)">
    部分 Comcast/Xfinity 网络会通过 Xfinity Advanced Security 错误地拦截 `docs.openclaw.ai`。请将其禁用或把 `docs.openclaw.ai` 加入白名单,然后重试。也可以帮我们申请解封:[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    仍然被拦截?文档在 GitHub 上有镜像:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 与 beta 的区别">
    **Stable** 和 **beta** 是 **npm dist-tags**,不是两条独立的代码线:

    - `latest` = stable
    - `beta` = 用于测试的早期构建(beta 缺失或早于当前 stable 版本时,回退到 `latest`)

    stable 版本通常先落在 **beta** 上,然后通过一次显式的提升步骤把同一版本移到 `latest`,版本号保持不变。维护者也可以直接发布到 `latest`。这就是为什么提升之后 beta 和 stable 可能指向**同一个版本**。

    查看变更内容:[CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)。

  </Accordion>

> 注:篇幅所限仅译核心章节,完整内容见原项目。
