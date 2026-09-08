> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "在 Control UI 或 CLI 中从失败的 OpenClaw 更新中恢复"
read_when:
  - OpenClaw 更新失败
  - Gateway 未报告最终的更新结果
title: "更新故障排查"
---

更新恢复流程落定后,失败的更新会进入内置的排查(triage)环节。在交互式终端中,OpenClaw 会收集脱敏后的诊断信息,并打开[排查 agent 选择器](/cli/triage)。在使用 `--yes`、`--json`,或没有交互式终端的情况下,它只会准备诊断信息和交接命令,不会启动 agent。最初的更新失败状态和退出码始终是最权威的;诊断信息不会把一次失败的更新变成成功的更新。

在 Control UI 中,一次失败的尝试会打开 **Ask OpenClaw**,附上其记录的详细信息,并让它在重试前先进行调查。连接丢失或验证超时会以“结果未知”的形式呈现。该标签页会记住最近 32 个已调查的尝试标识,并按各自所属的 Gateway 和 profile 划分作用域。状态检查、在这些作用域之间切换,以及重新加载同一个标签页,都不会自动重发这些调查请求。如果浏览器无法读取或保存这份历史记录,失败详情仍会保持可见,只是不会自动发起诊断请求。此时请手动 Ask OpenClaw,或在宿主机上运行 `openclaw triage`。如果 Gateway 或 agent 不可用,请在 Gateway 所在主机上使用 `openclaw triage`。自动诊断会保留你尚未发送的输入框草稿,即使其会话必须重启也不例外。

**Control UI → Settings → Updates** 会持续显示最近一次记录在案的尝试,包括其时间、更新前后的标识、原因代码、失败的步骤,以及范围受限的诊断细节。当状态检查重新读取同一次尝试时,版本或修订(revision)验证失败会继续保持可见。验证结果未知的状态,会在预期的版本或修订出现时解除,或在同一次尝试报告最终失败或取消时解除;新一次记录的尝试也可能将其取代。主动取消、本就已是最新版本的安装,以及仍在进行中的更新,都不会触发排查。

对于最终失败的尝试,**Report update failure** 与 **Retry** 和 **Ask OpenClaw** 相互独立。它会预览一份内容受限的报告,包含 OpenClaw 版本、平台、更新目标、失败的阶段、脱敏后的诊断信息,以及经过验证的回滚结果。报告不包含密钥、令牌、聊天内容、原始日志、私有绝对路径和恢复命令。在管理员确认该预览之前,不会提交任何内容;确认之后,OpenClaw 会走现有的 GitHub CLI issue 流程。回退(fallback)和待定(pending)结果会在本地保留这份脱敏报告;已确认的 issue 只保留其持久化的 issue URL。OpenClaw 会先用当前活跃的 `github.com` 账户发起一次静默的只读请求。如果缺少 CLI,或身份验证检查失败、不可用或超时,则返回一个预填好的 issue 链接,而不会开始创建 issue。在 Control UI 中,针对所记录尝试被中断的准备工作,可以在其本地预留过期后重试。一旦 issue 创建开始,如果出现超时、信号、非零退出码或格式错误的响应,且没有经验证的 issue URL,该尝试就会保持待定状态且不带重放链接,因为 issue 创建的结果可能未知。该操作绑定到单次更新尝试标识,不能对同一次尝试提交两次;重新连接或刷新状态也绝不会自动上报它。CLI 上报出错时会返回到显式操作菜单,绝不会代替用户启动诊断。

Control UI 的修复手段只使用类型化的产品动作。当所连接的 UI 具备所需的能力和权限范围时,它会优先采用经过身份验证的 Gateway 动作或原生动作,为破坏性操作保留确认环节,并把终端命令作为宿主机侧的次级后备。它从不解析本地化指引文本,也从不执行任意的命令字符串。

## 在 Control UI 中恢复

1. 当 Gateway 已重启、断开连接或未报告最终结果时,选择 **Check status**。此操作只读取 `update.status`,不会启动另一次更新。检查进行期间,恢复控件保持禁用;被拒绝的请求会以错误形式显示在页面上。
2. 打开 **View details**,处理所记录的失败步骤。诊断文本在展示时经过限定和脱敏;需要更多上下文时,请查看 Gateway 日志。
3. 只有在原因解决之后才选择 **Retry update**。Control UI 走正常的需确认更新流程,并说明 Gateway 重启期间正在运行的会话会被中断。

这些控件要求:已连接 Gateway、支持对应的类型化 Gateway 方法,并具备管理员权限范围。条件不满足时,请在 Gateway 所在主机上使用 CLI 后备方案。

## 原因代码

- `dirty`、`no-upstream`:先修复源码 checkout,再重试。
- `plugin-target-unavailable`:某个已启用的配置型 npm 插件针对所选核心没有可解析的目标,或其 registry 元数据无法读取。这次拒绝会在服务中的 Gateway 停止或核心包变动之前,指明涉及的插件、包目标和 registry 错误。可在发布完成或 registry 恢复后重试,使用 `openclaw update --tag <older-version>`,或禁用受影响的插件后重试。如果核心版本未知,请选择一个确切的 registry 版本。Extended-stable 渠道拒绝 `--tag`;请稍后重试,或显式切换渠道。`--dry-run` 会执行相同的可用性检查。
- `preflight-insufficient-space`:清理包含 preflight 暂存区(POSIX 上为 checkout 的 `.artifacts` 目录)和包管理器存储的文件系统上的空间,然后重试。更新器在确认遇到 ENOSPC 时会直接停止,而不是去尝试更旧的 commit;它不会删除共享的包管理器存储。暂存区的位置以及旧版已发布更新器的限制,参见 [Git checkout 流程](/cli/update#git-checkout-flow)。
- `deps-install-failed`、`build-failed`、`ui-build-failed`:检查失败的步骤,修复依赖或构建错误,然后重试。
- `global-install-failed`:检查包管理器的归属关系和权限后重试。如果包安装不完整,请重新运行安装器。
- `doctor-failed`:在 Gateway 所在主机上运行 Doctor,处理其发现的问题,然后重试。
- `restart-disabled`、`restart-unavailable`:先恢复受支持的 supervisor 或启用 Gateway 重启,再重试。
- `restart-unhealthy`、`restart-revision-mismatch`、`restart-revision-unavailable`:重试前,检查 Gateway 服务健康状况及其安装根目录。
- `managed-service-handoff-*`:先检查状态。如果交接已停止,请在 Gateway 所在主机上使用 CLI,以保留完整的诊断输出。

未知的原因代码会保持可见。重试前请先检查 Gateway 日志。

## CLI 后备方案

请在 Gateway 所在主机上运行以下命令,而不是在仅仅打开了 Control UI 的电脑上运行:

```bash
openclaw update status --json
openclaw triage
```

使用 `openclaw update --dry-run` 预览一次新的尝试。如果包更新在安装开始后才失败,请按照[更新](/install/updating#alternative-re-run-the-installer)中的安装器恢复步骤操作。

如果已安装的 CLI 损坏,或文件系统无法写入诊断信息,自动排查会报告该失败并保留最初的更新错误。先修复已安装的命令,然后运行 `openclaw triage`。即使 Gateway 无法启动,托管更新也会保留其分离的 helper 日志;所记录的结果会指向可用的诊断信息或失败的收集尝试。重启通知会概括诊断结果。保存的 artifact 路径,以及与具体安装对应的精确恢复命令,只保留在宿主机命令输出或托管更新 helper 日志中,不会出现在发送给 agent 或频道的通知里。

如果更新器在 Gateway 停止后崩溃或被强制终止,Gateway 会保持停止状态,除非更新器已完成恢复并通过验证。请检查 `openclaw gateway status --deep`,修复所报告的依赖或安装故障,然后重新运行 `openclaw update`。Git 依赖安装失败时,会先恢复并重新构建之前的运行时,才允许自动重启。经过验证的恢复之后的重启,仍会检查已安装的配置、服务归属和 Gateway 健康状况。

## 回滚边界

不要把恢复状态当作应对更新失败的第一反应。应先在保留当前状态的前提下重新安装已知良好的代码。只有当旧代码无法读取当前配置或数据库时,才恢复经过验证的更新前状态快照。参见[回滚](/install/updating#rollback)。

## 支持诊断

收集以下信息时,不要贴出凭据、原始配置或未脱敏的进程输出:

- OpenClaw 版本和安装类型;
- 来自 Settings → Updates 的更新时间戳、目标、阶段和原因代码;
- **View details** 显示的范围受限的失败详情;
- `openclaw update status --json`;
- `openclaw gateway status --deep --json`;
- 相关的已脱敏 Gateway 日志行。
