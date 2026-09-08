> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "完全卸载 OpenClaw(CLI、服务、状态数据、工作区)"
read_when:
  - 你想把 OpenClaw 从某台机器上移除
  - 卸载后 Gateway 服务仍在运行
title: "卸载"
---

两条路径:

- **简单路径**:适用于 `openclaw` 仍已安装的情况。
- **手动移除服务**:适用于 CLI 已删除但服务仍在运行的情况。

## 简单路径(CLI 仍已安装)

该命令会独立尝试各个请求的清理范围,只要其中任何一个范围失败或被阻止,就返回非零状态码。服务卸载仍然是删除状态数据和工作区前的安全闸门;如果该闸门失败,这些数据范围将被保留,同时仍会尝试清理应用。部分清理会被明确报告,绝不会随之给出无条件的"完成"结果。

推荐做法:使用内置卸载程序:

```bash
openclaw uninstall
```

交互式提示默认只预选 Gateway 服务。若要彻底本地清除,请在提示中同时选择 state、workspace 和 app,或运行 `openclaw uninstall --all`。除非你同时选择 `--workspace`,否则移除 state 时会保留已配置的工作区目录。

预览将要移除的内容(安全):

```bash
openclaw uninstall --dry-run --all
```

非交互模式(自动化 / npx)。请谨慎使用,且仅在确认清理范围之后使用:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

标志参数:`--service`、`--state`、`--workspace`、`--app` 分别选择单个清理范围;`--all` 选择全部四项。

手动步骤提供了完整的移除路径,但直接删除状态目录并不具备内置卸载程序保留工作区的行为。如果你想要与 `openclaw uninstall --state` 等效的效果,请在删除 state 之前先保留所有已配置的工作区。

1. 停止 Gateway 服务:

```bash
openclaw gateway stop
```

2. 卸载 Gateway 服务(launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. 决定是否保留工作区。

`openclaw uninstall --state` 会刻意保留已配置的工作区目录,包括默认的 `~/.openclaw/workspace`。在使用下面的手动 `rm -rf` 之前,请把想保留的工作区移到状态目录之外。如果你也想删除它,而它又位于状态目录内,则无需单独执行删除。

4. 删除 state 与配置:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你把 `OPENCLAW_CONFIG_PATH` 设置为状态目录之外的自定义位置,也请删除该文件。
在重新创建父目录后,把保留的工作区恢复到其配置路径,或者在下次安装时更新工作区路径。

5. 仅当你还想删除其中的 agent 文件时,才删除存储在状态目录之外的工作区:

```bash
rm -rf /path/to/external/workspace
```

6. 移除 CLI 安装(选择你实际使用的那一种):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

7. 如果你安装过 macOS 应用:

```bash
rm -rf /Applications/OpenClaw.app
```

注意事项:

- 如果你使用了 profile(`--profile` / `OPENCLAW_PROFILE`),请对每个状态目录重复步骤 3-4(默认为 `~/.openclaw-<profile>`)。
- 在远程模式下,状态目录位于 **gateway 主机**上,因此也需要在那台主机上执行步骤 1-4。

## 手动移除服务(未安装 CLI)

如果 Gateway 服务仍在运行但 `openclaw` 已不存在,请使用此方法。

### macOS(launchd)

默认 label 为 `ai.openclaw.gateway`(使用 profile 时为 `ai.openclaw.<profile>`):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

如果你使用了 profile,请把 label 和 plist 名称替换为 `ai.openclaw.<profile>`。

### Linux(systemd 用户单元)

默认单元名称为 `openclaw-gateway.service`(或 `openclaw-gateway-<profile>.service`)。从非常古老的安装升级而来的机器上,可能仍残留重命名前的 `clawdbot-gateway.service` 单元;`openclaw uninstall` / `openclaw gateway uninstall` 会自动检测并移除它。

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service{,.bak}
systemctl --user daemon-reload
```

### Windows(计划任务)

默认任务名称为 `OpenClaw Gateway`(或 `OpenClaw Gateway (<profile>)`)。
该任务会启动状态目录下一个无窗口的 `gateway.vbs` 脚本,而该脚本又会运行 `gateway.cmd`;请把两者都删除。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

如果你使用了 profile,请删除对应的任务名称,以及 `~\.openclaw-<profile>` 下的 `gateway.cmd` / `gateway.vbs` 文件。

## 常规安装与源码检出

### 常规安装(install.sh / npm / pnpm / bun)

如果你使用的是 `https://openclaw.ai/install.sh` 或 `install.ps1`,CLI 是通过 `npm install -g openclaw@latest` 安装的。
用 `npm rm -g openclaw` 移除它(如果你是用 `pnpm` / `bun` 安装的,则分别使用 `pnpm remove -g` / `bun remove -g`)。

### 源码检出(git clone)

如果你从仓库检出运行(`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. **先**卸载 Gateway 服务,再删除仓库(使用上面的简单路径或手动移除服务)。
2. 删除仓库目录。
3. 按上文说明移除 state 与工作区。

## 相关链接

- [安装概览](/install)
- [迁移指南](/install/migrating)
