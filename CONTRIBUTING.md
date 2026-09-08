> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

# 参与贡献 OpenClaw

欢迎来到龙虾池!🦞

## 快速链接

- **GitHub:** https://github.com/openclaw/openclaw
- **愿景:** [`VISION.md`](VISION.md)
- **Discord:** https://discord.gg/clawd
- **X/Twitter:** [@openclaw](https://x.com/openclaw)

## 维护者

当前的 OpenClaw 基金会团队与核心维护者名单见 OpenClaw 人员页面:https://www.openclaw.org/people

## 如何参与贡献

1. **Bug 与小修复** → 直接提 PR!
2. **新功能 / 架构改动** → 先开 [GitHub Issue](https://github.com/openclaw/openclaw/issues/new/choose) 或在 Discord 里问一声。大多数功能不会被接受,应当改用我们的 plugin SDK 做成第三方插件。
3. **纯重构 PR** → 不要提。除非维护者在某个具体修复中明确要求,否则不接受纯重构改动。
4. **针对 `main` 已知失败的 Test/CI-only PR** → 不要提。维护者团队已经在跟踪这些失败,只为追赶这些失败而调整测试或 CI 的 PR 会被关闭,除非这是验证新修复所必需的。
5. **提问** → Discord [#help](https://discord.com/channels/1456350064065904867/1459642797895319552) / [#users-helping-users](https://discord.com/channels/1456350064065904867/1459007081603403828)

## Issue、PR 与联系渠道分流

在创建 GitHub 条目之前,先参照这张分流表:

| 情况 | 渠道 | 需要提供的证据 |
| --- | --- | --- |
| 产品 bug、回归、崩溃或行为缺陷 | [Bug 报告](https://github.com/openclaw/openclaw/issues/new?template=bug_report.yml) | 复现步骤、预期行为与实际行为、版本、操作系统、相关时的 model/provider、日志/截图、影响 |
| 文档 bug 或文档缺失/自相矛盾 | [文档 bug 报告](https://github.com/openclaw/openclaw/issues/new?template=docs_bug_report.yml) | 受影响的文档路径或 URL、验证步骤、预期的文档内容、实际的文档内容、影响、证据 |
| 新功能、架构变更或产品改进 | 提交 [Feature request](https://github.com/openclaw/openclaw/issues/new?template=feature_request.yml) 或先在 Discord 讨论 | 问题描述、建议方案、备选方案、影响、示例或已有先例 |
| 上手引导、安装帮助或一般支持问题 | Discord [#help](https://discord.com/channels/1456350064065904867/1459642797895319552) / [#users-helping-users](https://discord.com/channels/1456350064065904867/1459007081603403828) | 除非存在具体的产品缺陷或文档缺口,否则不要开 GitHub issue |
| 安全漏洞 | 见下文[报告漏洞](#report-a-vulnerability) | 安全报告请勿提公开 issue |
| 针对已有或新开 issue 的 PR | 使用 [PR 模板](.github/pull_request_template.md) | 清晰可见的 `Closes #<issue>` 或 `Related: #<issue>`、问题描述、交付的解决方案、用户影响、验证证据 |

对于由 agent 撰写或其他非琐碎的改动,先创建或复用对应 issue,再针对它提 PR。Bug 和非常小的修复可以直接提 PR,但在存在相关上下文时仍要链接它,并填写 PR 模板。

不要猜该 @ 谁。让 issue 表单、标签/自动化机制和 `.github/CODEOWNERS` 来分流工作。只有当某个被管辖的路径或明确记录的职责直接相关、且你需要一个决策时才 mention 维护者;否则走正常 review 流程。对于成套的协同改动,在开出超过 PR 数量上限之前,先去 **#clawtributors** 问一声。

## PR 数量上限

我们的上限是**每位作者 20 个开放 PR**。超出后会被打上 `r: too-many-prs` 标签,PR 会被自动关闭。这是硬性上限。

如果成套协同改动确实需要超过 20 个 PR,请先加入 Discord 的 **#clawtributors** 频道,与维护者沟通。

## 源码依赖

在工作区根目录运行 `pnpm install --frozen-lockfile`。源码检出使用 pnpm 的 isolated linker,依赖保存在 `node_modules/.pnpm` 中,再链接进每个 workspace 包。在受支持的 macOS 卷上,这还能让 pnpm 复用整包的 APFS clone,而不是逐个导入文件。

给每个源码检出各自独立的依赖安装。工具不会自动把缺失的 `node_modules` 链接到另一个检出。已有的"借来"安装仍可直接供 Node 工具使用。正常的 pnpm install 会在调和之前检查检出根目录的 `node_modules`、显式配置的根模块目录以及它们的 `.pnpm` 目录,并拒绝那里的借用链接。请保留那个供体安装,另建一个独立拥有的安装,而不是删除它或通过其链接重装。当 workspace 链接指向配置的物理目录时,显式水合(hydrated)的模块目录仍然受支持。该准入检查通过 `pnpm:devPreinstall` 运行;`--ignore-scripts` 会跳过它。这项检查不会锁定路径以防并发替换,不会检查每个 workspace 包的依赖,也不会校验所有备选的 pnpm 目录设置。

更新原先使用 hoisted 布局的检出时,先停掉所有使用该检出依赖的构建、测试和 watcher,再运行安装命令。在其他任务还在使用同一个 `node_modules` 时,不要更换 linker。在真正导入依赖的包里声明依赖;根目录的工具和测试必须声明自己的开发依赖,而不是依赖 hoisting。

## 提 PR 之前

- 源码检出请使用 **Node 24.16+ LTS** 或 **Node 26.1+**。更旧的 Node 版本可能截断 SQLite TEXT 读取;Node 22、23、25 均不受支持。如果本地版本太旧,参见 [Node 安装指引](docs/install/node.md)。
- 在 Node 24.16+ 或 Node 26.1+ 上运行 Vitest 5 测试套件,与打包时的运行时下限保持一致。
- 用你自己的 OpenClaw 实例做本地测试
- 在实施重大的 SQLite 或持久化存储改动之前,先发起或关联一个维护者讨论,并让设计获得认可。参见[数据库 schema 评审检查点](docs/reference/database-schemas.md#review-checkpoint-for-material-changes)。
- 外部 PR 必须在 **What Problem This Solves** 中描述用户、产品或运维层面的问题,并在 **Evidence** 中给出有效的验证。聚焦的测试、CI 结果、截图、录屏、终端输出、实际观察、脱敏日志和工件链接都算数。Reviewer 会审查代码、测试和 CI;请利用 PR 正文说明意图,让验证内容易于理解。
- 当 ClawSweeper、Barnacle 或维护者要求补充上下文或证据时,请编辑 PR 描述,而不是只在新评论里回复。保持 **What Problem This Solves**、**Why This Change Was Made**、**User Impact** 和 **Evidence** 始终为最新;可以用一条简短评论提醒 reviewer 查看更新,但 PR 正文应当始终是面向维护者和 bot 的持久说明。
- 保持 PR 可随时接管:从维护者可以推送的分支发起 PR。对于 fork PR,请保留 GitHub 的 **Allow edits by maintainers** 选项为启用状态,以便维护者在需要时完成紧急修复或合并准备。如果 GitHub 显示 **Allow edits and access to secrets by maintainers**,仅在你接受该 workflow/secrets 访问时才启用,并在 PR 中说明。
- 不要在普通 PR 中或合并时修改 `CHANGELOG.md`。更新日志在发布时由已合并的 PR 和提交生成;在此之前,请把 release note 相关内容写在 PR 正文或提交信息里。
- 运行测试:`pnpm build && pnpm check && pnpm test`
- 在对所改动面跑过等效的针对性验证之后,迭代期间的本地提交可以用 `git commit --no-verify` 跳过 commit hooks。
- 对于扩展/插件改动,先跑快速本地通道:
  - `pnpm test:extension <extension-name>`
  - `pnpm test:extension --list` 查看有效的扩展 id
  - 如果改动了共享的插件或 channel 面,运行 `pnpm test:contracts`
  - 针对性的共享面改动,使用 `pnpm test:contracts:channels` 或 `pnpm test:contracts:plugins`
  - 这些命令也会覆盖默认单元测试通道跳过的共享 seam/smoke 文件
  - 如果改动了更大范围的运行时行为,在请求 review 之前仍要运行相关的更大范围通道(`pnpm test:extensions`、`pnpm test:channels` 或 `pnpm test`)
- 如果你在共享代码中触及了 bundled plugin 的边界,运行对应的清单检查:
  - `node --import tsx scripts/check-src-extension-import-boundary.mts --json`(针对 `src/**`)
  - `node --import tsx scripts/check-sdk-package-extension-import-boundary.mts --json`(针对 `src/plugin-sdk/**` 和 `packages/**`)
  - `node --import tsx scripts/check-test-helper-extension-import-boundary.mts --json`(针对 `test/helpers/**`)
- 共享测试辅助必须使用 `src/test-utils/bundled-plugin-public-surface.ts`,而不是仓库相对的 `extensions/**` 导入。插件局部的深度 mock 要放在所属的 bundled plugin 包内部。
- 如果你正在使用带 OpenClaw skills 的 AI 编码 agent,在开 PR 或更新 PR 之前先运行 `autoreview` skill。在请求 review 之前,先处理被采纳/可执行的发现。
- 不要提交纯重构 PR,除非维护者为某个进行中的修复或交付物明确要求了该重构。
- 不要为 `main` CI 上已经变红的失败提交测试或 CI 配置修复。如果某个失败已经出现在 [main 分支 CI 运行](https://github.com/openclaw/openclaw/actions)中,那就是维护者团队正在跟踪的已知问题,只处理这些失败的 PR 会被自动关闭。如果你发现了尚未出现在 main CI 中的_新_回归,请先提 issue 报告。
- 不要提交只为让 `main` CI 已知失败通过的 test-only PR。只有当测试改动是验证新修复所必需、或在同一个 PR 中覆盖新行为时,才是可接受的。
- 确保 CI 检查通过
- 保持 PR 聚焦(一个 PR 只做一件事;不要混杂无关内容)
- 说明做了什么以及为什么
- **附上截图** —— 一张展示问题/改前,一张展示修复/改后(针对 UI 或视觉改动)
- 代码、注释、文档和 UI 字符串使用美式英语拼写和语法
- 不要修改受 `CODEOWNERS` 安全管辖的文件,除非列出的 owner 本人编写或明确要求了该改动,或已经在与你共同评审它。对于针对 ownership/review 策略本身的治理性变更,仅当 GitHub 组织的实时成员数据显示 `state: active` 且 `role: admin` 时,组织 owner 的明确指示才同样有效;仅有仓库 `ADMIN`、`viewerCanAdminister` 或 bypass 权限永远不够。这两种途径都不能豁免 GitHub 强制的审批规则。把这些路径当作受限的评审面,而不是顺手清理的目标。

## 本地提交钩子

正常的 `pnpm install` 安装流程会在 `core.hooksPath` 未设置时启用仓库的 pre-commit 格式化钩子。已有的钩子配置(包括显式设为空值)会被保留。Git 把初始化范围限定在当前检出。使用多个 worktree 时,自动设置要求启用 `extensions.worktreeConfig`;否则 Git 会报出警告,并在不更改钩子设置的情况下继续安装。仓库所有者可以按照 [Git 的配置指引](https://git-scm.com/docs/git-worktree#_configuration_file)启用 per-worktree 配置。

钩子的可选内容守卫会读取一个私有 UTF-8 文件,该文件由原生 Git 设置 `hooks.blockedLiteralsFile` 指定。在检出之外的文件中每行写一个字面量,例如 `~/.config/openclaw/blocked-literals.txt`,然后为该检出配置:

```bash
git config --local hooks.blockedLiteralsFile "$HOME/.config/openclaw/blocked-literals.txt"
```

Git 元数据目录是存放这个私有文件的另一个安全的未跟踪位置。绝不要把私有规则内容放进被跟踪的文件或 PR。未设置时,内容守卫处于禁用状态,格式化正常运行;配置了空路径,或文件缺失、不可读、为空或无效时,提交会被阻止。

配置之后,守卫会在格式化之前检查区分大小写的字面量子串,并在格式化后重新暂存文件时再检查一次。每次扫描覆盖新增、修改和类型变更文件的完整暂存内容,包括重命名的目标路径以及被修改文件中未更改的行。文档、测试、生成文件和二进制文件都包含在内;没有任何被跟踪文件可以豁免。

如果钩子阻止了提交,请移除匹配的内容并重新暂存被报告的文件。未更改的历史文件和删除操作不会被扫描。子模块内容和符号链接目标不会被搜索。这是本地防护,不是 CI 或服务端强制:绕过或禁用钩子同样会绕过这项检查。

## Review 对话由作者主导

在 PR 收到 Barnacle、ClawSweeper 或维护者的反馈后,请阅读 [pull request review flow](https://docs.openclaw.ai/reference/pull-request-review-flow),了解如何理解 rank-up 操作、证据指引、复审请求以及评审对话的后续跟进。

## Control UI 装饰器

Control UI 使用 Lit 的**旧版(legacy)**装饰器(当前的 Rollup 解析不支持标准装饰器所需的 `accessor` 字段)。添加响应式字段时,请保持旧版风格:

```ts
@state() foo = "bar";
@property({ type: Number }) count = 0;
```

根目录的 `tsconfig.json` 已按旧版装饰器配置(`experimentalDecorators: true`),并设置 `useDefineForClassFields: false`。除非你同时在升级支持标准装饰器的 UI 构建工具链,否则不要翻转这些选项。

## 欢迎 AI/Vibe 编写的 PR!🤖

用 Codex、Claude 或其他 AI 工具构建的?**欢迎!**不需要 AI 辅助标签,也不需要披露声明。

请在 PR 中包含:

- [ ] 附上简明的 **Evidence** 小节,给出最有用的验证内容。Reviewer 会审查代码、测试和 CI,而不是只依赖 PR 正文。
- [ ] 确认你理解这些代码在做什么
- [ ] 在可用时运行 `autoreview` skill,并处理被采纳/可执行的发现
- [ ] 在收到 Barnacle、ClawSweeper 或维护者反馈后,遵循 [pull request review flow](https://docs.openclaw.ai/reference/pull-request-review-flow)

AI PR 在这里是第一等公民,与任何其他 PR 遵循相同的质量和评审标准。

## 当前重点与路线图 🗺

我们目前优先推进:

- **稳定性**:修复 channel 连接(WhatsApp/Telegram)中的边缘问题。
- **UX**:改进上手向导和错误消息。
- **Skills**:技能贡献请前往 [ClawHub](https://clawhub.ai/) —— OpenClaw 技能的社区中心。
- **性能**:优化 token 使用与压缩(compaction)逻辑。

查看 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 中带 ["good first issue"](https://github.com/openclaw/openclaw/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 标签的条目。如果没有开放的,可以挑一个小的文档或 bug issue,留一条简短评论说你想来做。

## 维护者

我们正在有选择地扩充维护者团队。如果你是一位有经验的贡献者,想通过代码、文档或社区工作帮助塑造 OpenClaw 的方向,我们愿意听听你的想法。

成为维护者是一份责任,而不是荣誉头衔。我们期待持续、积极的投入 —— 分诊 issue、评审 PR、推动项目前进。

仍然感兴趣?给 contributing@openclaw.ai 发邮件,附上:

- 你在 OpenClaw 上的 PR 链接(如果还没有,先从这里开始)
- 你维护或积极贡献的开源项目链接
- 你的 GitHub、Discord 和 X/Twitter 账号
- 简短的自我介绍:背景、经验和感兴趣的领域
- 你会说的语言和所在地区
- 你实际能投入的时间

我们欢迎各种技能背景的人 —— 工程、文档、社区运营等等。我们会认真评审每一份仅由人工撰写的申请,并以缓慢、审慎的节奏增加维护者。请预留几周等待回复。

## 报告漏洞

我们认真对待安全报告。请直接向问题所在的仓库报告漏洞:

- **核心 CLI 与 Gateway** — [openclaw/openclaw](https://github.com/openclaw/openclaw)
- **macOS 桌面应用** — [openclaw/openclaw](https://github.com/openclaw/openclaw)(apps/macos)
- **iOS 应用** — [openclaw/openclaw](https://github.com/openclaw/openclaw)(apps/ios)
- **Android 应用** — [openclaw/openclaw](https://github.com/openclaw/openclaw)(apps/android)
- **ClawHub** — [openclaw/clawhub](https://github.com/openclaw/clawhub)

对于不适合某个具体仓库的问题,或者你不确定时,请发邮件至 **security@openclaw.ai**,我们会进行分流。

### 报告中必须包含

1. **标题**
2. **严重程度评估**
3. **影响**
4. **受影响组件**
5. **技术复现**
6. **已演示的影响**
7. **环境**
8. **修复建议**

> 注:篇幅所限仅译核心章节,完整内容见原项目。
