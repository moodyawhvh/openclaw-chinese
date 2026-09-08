> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "关于 OpenClaw 安装、配置与使用的常见问题解答"
read_when:
  - 回答常见的安装部署、上手引导或运行时支持问题
  - 在深入调试前对用户反馈的问题进行分诊
title: "常见问题(FAQ)"
---

这里既有速查答案,也覆盖真实环境(本地开发、VPS、多 agent、OAuth/API key、模型故障切换)下的深度排障。运行时诊断请参阅[故障排查](/gateway/troubleshooting);完整配置参考请参阅[配置](/gateway/configuration)。

## 出问题后的前 60 秒

<Steps>
  <Step title="快速状态">
    ```bash
    openclaw status
    ```
    本地快速概览:操作系统与更新、Gateway/服务可达性、agent 与会话、provider 配置及运行时问题(需 Gateway 可达)。
  </Step>
  <Step title="可直接粘贴的报告(可安全外发)">
    ```bash
    openclaw status --all
    ```
    只读诊断,附带日志尾部(token 已脱敏)。
  </Step>
  <Step title="守护进程与端口状态">
    ```bash
    openclaw gateway status
    ```
    显示 supervisor 运行状态与 RPC 可达性的对比、探测目标 URL,以及服务可能使用的配置。
  </Step>
  <Step title="深度探测">
    ```bash
    openclaw status --deep
    ```
    对 Gateway 的实时健康探测,支持时还会探测各通道(要求 Gateway 可达)。参见[健康检查](/gateway/health)。
  </Step>
  <Step title="查看最新日志尾部">
    ```bash
    openclaw logs --follow
    ```
    如果 RPC 不可用,退而使用:
    ```bash
    tail -f "/tmp/openclaw/openclaw-$(date +%F).log"
    # 命名 profile 示例:
    tail -f "/tmp/openclaw/openclaw-dev-$(date +%F).log"
    ```
    文件日志与服务日志相互独立;参见[日志](/logging)与[故障排查](/gateway/troubleshooting)。
  </Step>
  <Step title="运行 doctor(自动修复)">
    ```bash
    openclaw doctor
    ```
    修复/迁移配置与状态,随后执行健康检查。参见 [Doctor](/gateway/doctor)。
  </Step>
  <Step title="Gateway 快照(仅 WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # 出错时显示目标 URL 与配置路径
    ```
    向运行中的 Gateway 请求完整快照。参见[健康检查](/gateway/health)。
  </Step>
</Steps>

## 快速上手与首次运行配置

首次运行的问答——安装、引导、认证方式、订阅、初始故障——见[首次运行 FAQ](/help/faq-first-run)。

## OpenClaw 是什么?

<AccordionGroup>
  <Accordion title="用一段话介绍 OpenClaw?">
    OpenClaw 是一个运行在你自己基础设施上的 AI 助手——可以自用,也可以与团队共享。它能在你已经在用的消息平台上回复(Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp,以及 QQ Bot 等内置通道插件),还支持语音,并可在聊天、会话面板和 macOS 面板中提供托管小组件。**Gateway** 是常驻的控制平面,而助手本身才是产品。同一个 Gateway 既可服务一个人的 WhatsApp,也能借助[多用户会话](/concepts/multi-user)扩展为共享工作区机器人。
  </Accordion>

  <Accordion title="团队可以共用一个 OpenClaw 吗?">
    可以。共享 Gateway 是受支持的一等部署方式:每个会话都带有不可变的创建者、可指派的所有者,以及实际使用它的成员;Control UI 会实时显示谁在查看、谁在输入;来自共享会话的提交还可以附带 `Co-authored-by` trailer,记录实际引导这次操作的人。[具名操作员角色](/gateway/operator-scopes#named-operator-roles)限制了每位队友能做的事。

    有一条边界必须记住:一个 Gateway 就是一个信任域。请只与彼此信任的人共用;互相对立的用户应当使用各自独立的 Gateway。参见[团队部署](/start/teams)、[多用户模式](/concepts/multi-user)与[安全](/gateway/security)。

  </Accordion>

  <Accordion title="核心价值">
    OpenClaw 不只是“Claude 套壳”。它是一个**本地优先的控制平面**,在**你自己的硬件**上运行一个能力完备的助手,可从你日常使用的聊天应用访问,并带有有状态的会话、记忆和工具——而不必把你的工作流交给托管 SaaS。

    - **设备与数据归你**:Gateway 想跑在哪就跑在哪(Mac、Linux、VPS),工作区和会话历史留在本地。
    - **真实通道,而非网页沙盒**:Discord/iMessage/Signal/Slack/Telegram/WhatsApp 等,外加移动端语音和托管小组件。
    - **模型无关**:可选用 Anthropic、MiniMax、OpenAI、OpenRouter 等,支持按 agent 路由与故障切换。
    - **纯本地选项**:运行本地模型,所有数据都可以留在你的设备上。
    - **多 agent 路由**:按通道、账号或任务拆分出独立 agent,各自拥有自己的工作区和默认配置。
    - **开源且可改造**:可审查、可扩展、可自托管,不被厂商锁定。

    文档:[Gateway](/gateway)、[通道](/channels)、[多 agent](/concepts/multi-agent)、[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="刚装好,先做什么?">
    适合上手的第一个项目:搭一个网站(WordPress、Shopify 或静态站点);做一个移动 App 原型(大纲、界面、API 规划);整理文件和文件夹;连接 Gmail 并自动生成摘要或跟进提醒。

    它也能承接大型任务,但最好拆分成多个阶段,并用 sub-agent 并行推进。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五大日常用途?">
    - **个人简报**:汇总收件箱、日历和你关心的新闻。
    - **研究与起草**:快速调研、总结,以及邮件或文档初稿。
    - **提醒与跟进**:由 cron 或心跳驱动的提示与清单。
    - **浏览器自动化**:填表、收集数据、重复性网页操作。
    - **跨设备协同**:在手机上下发任务,让 Gateway 在服务器上执行,结果再回到聊天里。

  </Accordion>

  <Accordion title="OpenClaw 能帮忙做 SaaS 的获客、外联、广告和博客吗?">
    可以,用于**调研、筛选和起草**:扫描网站、建立候选名单、汇总潜在客户信息、撰写外联或广告文案草稿。

    至于**外联投放或广告投放**,请保持人工把关。不要发垃圾信息,遵守当地法律和平台政策,任何内容发出前都要人工审阅。让 OpenClaw 起草,由你来批准。

    文档:[安全](/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 归 OpenAI 所有吗?">
    不。OpenClaw 由独立的 501(c)(3) 组织 [OpenClaw Foundation](https://openclaw.org) 管理。OpenAI 只是若干捐赠方之一,而 OpenClaw 的作者就在那里工作。捐赠方并不拥有、控制或主导这个项目。Codex 只是多个 [agent harness](/concepts/agent-runtimes) 插件之一,代码中没有任何实验室的模型享有特权。

  </Accordion>

  <Accordion title="OpenClaw 会向基金会发送什么?">
    默认情况下,只发送一次每日更新检查,内容为 OpenClaw 版本、操作系统、Node 版本和 CPU 架构——任何软件包仓库都能看到的信息。可选的匿名功能统计默认关闭,且不含任何标识符。提示词、消息、模型名称、密钥、路径或机器标识符等绝不会发送给基金会。设置 `update.checkOnStart: false` 即可完全不发送。到你配置的模型提供商和聊天平台的流量是另一回事,照常直达对方;参见下文“OpenClaw 用到的数据都保存在本地吗?”。详情:[用量遥测与更新检查](/gateway/telemetry)。

  </Accordion>

  <Accordion title="OpenClaw 如何获得资金?与其他项目相比如何?">
    基金会依靠捐赠运作,没有可出售的产品:没有付费版、没有托管服务、也没有代币。它不接受风险投资。某些其他自托管 agent 由风投支持的公司开发,并在安装过程中推销自家 agent 的订阅。这是激励结构上的差异,并非对其工程能力的评判;参见[治理模式对比](/start/why-openclaw#governance)。

  </Accordion>

  <Accordion title="在 Web 开发方面,与 Claude Code 相比有什么优势?">
    OpenClaw 是**助手与协调层**,不是 IDE 的替代品。在仓库内追求最快的直接编码循环,用 Claude Code 或 Codex;需要持久记忆、跨设备访问和工具编排时,用 OpenClaw。

    - 跨会话持久的记忆和工作区。
    - 多平台访问(Telegram、WhatsApp、TUI、WebChat)。
    - 工具编排(浏览器、文件、调度、hooks)。
    - 常驻 Gateway(部署在 VPS 上,随时随地交互)。
    - 通过 Node 使用本地浏览器/屏幕/摄像头/命令执行。

    案例展示:[https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills 与自动化

<AccordionGroup>
  <Accordion title="如何自定义 skills 而不弄脏仓库?">
    请使用托管覆盖,而不是直接改仓库里的副本。把改动放到 `~/.openclaw/skills/<name>/SKILL.md`(或在 `~/.openclaw/openclaw.json` 中通过 `skills.load.extraDirs` 添加目录)。优先级顺序:`<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 内置 -> `skills.load.extraDirs`,因此托管覆盖会压过内置 skills,完全不必碰 git。如果希望全局安装但只对部分 agent 可见,可以把共享副本放在 `~/.openclaw/skills`,再用 `agents.defaults.skills` / `agents.entries.*.skills` 控制可见性。只有值得回馈上游的改动,才应对仓库副本提交 PR。
  </Accordion>

  <Accordion title="可以从自定义目录加载 skills 吗?">
    可以:在 `~/.openclaw/openclaw.json` 中通过 `skills.load.extraDirs` 添加目录(在上述顺序中优先级最低)。`clawhub` 默认安装到 `./skills`,OpenClaw 会在下一个会话把它视为 `<workspace>/skills`。要限制仅对特定 agent 可见,可配合 `agents.defaults.skills` 或 `agents.entries.*.skills` 使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同的模型或设置?">
    支持的模式:

    - **Cron 任务**:隔离任务可以按任务设置 `model` 覆盖。
    - **Agent**:把任务路由到不同 agent,各自拥有不同的默认模型、思考等级和流式参数。
    - **仅当前会话**:`/model <model> -s`(或 `--session`)不改动已配置的默认值。
    - **Agent 默认值 + 当前会话**:Owner/admin 执行 `/model <model> -a`(或 `--agent`)更新所选 agent。
    - **全局默认值 + 当前会话**:Owner/admin 执行 `/model <model> -g`(或 `--global`)更新 `agents.defaults.model`。

    单独的 `/model <model>` 会沿用 owner/admin 已配置默认值的持久化行为,除非你设置了可选的[模型选择范围](/gateway/config-agents/models#agentsdefaultsmodelselectionscope)。

    示例——同一个模型,不同 agent 各自的设置:

    ```json5
    {
      agents: {
        ownership: "explicit",
        entries: {
          coder: {
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          chat: {
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        },
      },
    }
    ```

    共享的按模型默认值放在 `agents.defaults.models["provider/model"].params`。若某个 agent 对该模型需要不同设置,用 `agents.entries.*.models["provider/model"].params`。扁平的 `agents.entries.*.params` 作用于该 agent 的所有模型,并优先于上述两层按模型配置。

    参见[Cron 任务](/automation/cron-jobs)、[多 Agent 路由](/concepts/multi-agent)、[配置](/gateway/config-agents)、[斜杠命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在干重活时卡住了,怎么把工作分流出去?">
    耗时或并行的任务请交给 **sub-agent**:它们在各自的会话里运行,只返回一份摘要,保证主聊天保持响应。可以让机器人“为这个任务生成一个 sub-agent”,或使用 `/subagents`。用 `/status` 查看 Gateway 当前是否繁忙。

    长任务和 sub-agent 都会消耗 token;如果成本敏感,可通过 `agents.defaults.subagents.model` 为 sub-agent 设置更便宜的模型。

    文档:[Sub-agent](/tools/subagents)、[后台任务](/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上绑定线程的 subagent 会话如何工作?">
    可以把 Discord 线程绑定到某个 subagent 或会话目标,这样线程里的后续消息都会留在绑定的会话中。

    - 用 `sessions_spawn` 并带 `thread: true` 生成(可选 `mode: "session"` 以获得持久跟进)。
    - `/agents` 可查看绑定状态。
    - `/session idle <duration|off>` 与 `/session max-age <duration|off>` 控制自动过期。
    - `/session unbind` 解绑线程但不关闭 agent 会话。

    配置项:`session.threadBindings.enabled`(总开关)、`session.threadBindings.idleHours`(默认 `24`,`0` 表示禁用)、`session.threadBindings.maxAgeHours`(默认 `0`,即不设硬性上限),以及 `session.threadBindings.spawnSessions`(生成时自动绑定,默认 `true`)。

    文档:[Sub-agent](/tools/subagents)、[Discord](/channels/discord)、[配置参考](/gateway/configuration-reference)、[斜杠命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="subagent 已完成,但完成通知发错了地方或根本没发出来,该检查什么?">
    检查最终解析出的请求方路由:

    - 完成模式下的 subagent 投递会优先使用已绑定的线程或会话路由(如果存在)。
    - 如果完成来源只携带通道信息,OpenClaw 会回退到请求方会话中存储的路由(`lastChannel` / `lastTo` / `lastAccountId`),直接投递仍可成功。
    - 既无绑定路由也没有可用的存储路由时:直接投递可能失败,结果会回退为排队会话投递,而不是立即发出。
    - 无效或过期的目标也可能导致回退到队列,或最终投递失败。
    - 如果子会话最后一条可见的助手回复恰好是 `NO_REPLY` / `no_reply` 或 `ANNOUNCE_SKIP`,OpenClaw 会刻意抑制通知,而不是发出早已过时的进度信息。

    调试:`openclaw tasks show <lookup>`,其中 `<lookup>` 可以是任务 id、运行 id 或会话 key。

    文档:[Sub-agent](/tools/subagents)、[后台任务](/automation/tasks)、[会话工具](/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发,该检查什么?">
    Cron 运行在 Gateway 进程内;如果 Gateway 不是持续运行,它就不会触发。

    - 确认 cron 已启用(`cron.enabled`),且未设置 `OPENCLAW_SKIP_CRON`。
    - 确认 Gateway 全天候运行(没有休眠/重启)。
    - 核对任务时区(`--tz` 与主机时区是否一致)。

    调试:
    ```bash
    openclaw automations run <jobId>
    openclaw automations runs <jobId> --limit 50
    ```

    文档:[Cron 任务](/automation/cron-jobs)、[自动化](/automation)。

  </Accordion>

  <Accordion title="Cron 触发了,但通道里什么都没收到,为什么?">
    检查投递模式:

    - `--no-deliver` / `delivery.mode: "none"`:本就不应有 runner 兜底发送。
    - 公告目标(`channel` / `to`)缺失或无效:runner 跳过了外发投递。
    - 通道鉴权失败(`unauthorized`、`Forbidden`):runner 尝试过投递,但凭证被拒。
    - 静默的隔离结果(仅有 `NO_REPLY` / `no_reply`)会被视为有意不投递,排队兜底投递同样会被抑制。

    对隔离的 cron 任务,只要有可用的聊天路由,agent 仍可用 `message` 工具直接发送。`--announce` 只控制 runner 对 agent 尚未自行发出的最终文本进行兜底投递。

    调试:
    ```bash
    openclaw automations runs <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    文档:[Cron 任务](/automation/cron-jobs)、[后台任务](/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离的 cron 运行会切换模型或重试一次?">
    这是运行中的模型切换路径,不是重复调度。当活跃运行抛出 `LiveSessionModelSwitchError` 时,隔离的 cron 会持久化一次运行时模型切换并重试,重试前保留切换后的 provider/model(以及任何切换后的 auth-profile 覆盖)。

    模型选择优先级:Gmail hook 模型覆盖(`hooks.gmail.model`)最先,其次是任务级 `model`,然后是已存储的 cron 会话模型覆盖,最后走正常的 agent/默认模型选择。
  </Accordion>
</AccordionGroup>

> 注:篇幅所限仅译核心章节,完整内容见原项目。
