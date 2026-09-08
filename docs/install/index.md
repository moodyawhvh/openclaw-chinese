> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "安装 OpenClaw——桌面应用下载、安装脚本、npm/pnpm/bun、从源码构建、Docker 等多种方式"
read_when:
  - 你需要「快速入门」之外的安装方式
  - 你想下载 Windows Hub 或 macOS 桌面应用,而不是 CLI
  - 你想部署到云平台
  - 你需要更新、迁移或卸载
title: "安装"
---

## 系统要求

- **Node 24.16+ 或 26.1+** —— 推荐 Node 26;缺少 Node 时,安装器会在 macOS 上配置 Node 26、在 Linux 上配置 Node 24 LTS(参见 [Node.js 兼容性](/install/node-compatibility))。
- **macOS、Linux 或 Windows** —— Windows 用户可以从原生 Windows Hub 应用、PowerShell CLI 安装器或 WSL2 Gateway 入手。参见 [Windows](/platforms/windows)。
- 只有从源码构建时才需要 `pnpm`。

## 下载桌面应用

不想用 CLI,更想直接下载一个普通应用?OpenClaw 提供桌面伴侣应用:

- **Windows**:[Windows Hub](/platforms/windows#recommended-windows-hub) 伴侣应用 —— 一个经过签名的安装包,像普通 Windows 应用一样下载并运行,内置安装引导、托盘状态、聊天和 node 模式:
  - [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
  - [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)
  - 全部 Hub 版本:[Windows Hub 发布页](https://github.com/openclaw/openclaw-windows-node/releases/latest)
- **macOS**:[macOS 菜单栏应用](/platforms/macos) —— 从 [OpenClaw GitHub 发布页](https://github.com/openclaw/openclaw/releases) 下载 `OpenClaw-<version>.dmg`(推荐)或 `.zip` 附件,然后安装并启动 **OpenClaw.app**。详情参见 [macOS 应用页面](/platforms/macos),包括最新版本未提供 macOS 附件时该怎么办。

两款桌面应用都可以在首次运行设置时配置一个本地 Gateway,也可以连接已有的远程 Gateway。

## 推荐方式:安装脚本

最快的安装方式。它会检测你的操作系统,按需安装 Node,安装 OpenClaw,并启动引导流程(onboarding)。

<Note>
Windows 桌面用户也可以安装原生 [Windows Hub](/platforms/windows#recommended-windows-hub) 伴侣应用,它包含安装引导、托盘状态、聊天、node 模式和本地 MCP 模式。
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

不运行引导流程、直接安装:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

全部参数与 CI/自动化选项参见 [安装器内部机制](/install/installer)。

## 其他安装方式

### 本地前缀安装器(`install-cli.sh`)

当你希望把 OpenClaw 和 Node 都保持在 `~/.openclaw` 这类本地前缀目录下、而不依赖系统级 Node 安装时,使用这种方式:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

默认支持 npm 安装,也可以在同一前缀流程下进行 git checkout 安装。完整参考:[安装器内部机制](/install/installer#install-clish)。

已经安装过了?可以用 `openclaw update --channel dev` 和 `openclaw update --channel stable` 在包安装与 git 安装之间切换。参见 [更新](/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已经在自行管理 Node:

<Tabs>
  <Tab title="npm">
    适用于 npm 12 或 npm 11.16+:

    ```bash
    npm install -g openclaw@latest --allow-scripts=openclaw
    openclaw onboard --install-daemon
    ```

    npm 11.15 及更早版本使用同样的命令,但去掉 `--allow-scripts=openclaw`。

    <Note>
    npm 12 默认阻止未经批准的包生命周期脚本。`--allow-scripts=openclaw` 选项会显式放行 OpenClaw 的 `preinstall` 和 `postinstall` 步骤;不加该选项,npm 会提示脚本 `blocked because they are not covered by allowScripts`。

    npm 11.16 接受该选项,但只会警告脚本 `not yet covered by allowScripts`,并照常执行它们。npm 11.15 及更早版本既没有该策略也没有该选项,所以命令必须不带该标志。npm 11.16 建议的 `npm approve-scripts openclaw` 命令对全局安装无效 —— 会直接报错 `ENOMATCH  No installed packages match: openclaw`。
    </Note>

    <Note>
    官方托管安装器在安装 OpenClaw 包时会清除 `min-release-age` 这类 npm 新鲜度过滤规则。如果你用 npm 手动安装,你自己的 npm 策略仍然生效。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g --allow-build=openclaw openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 要求对带构建脚本的包进行显式批准。全局安装不支持 `approve-builds -g`,所以请在 `pnpm add -g` 命令中改传 `--allow-build=openclaw`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g --trust openclaw@latest
    bun run --bun openclaw onboard --install-daemon --daemon-runtime bun
    ```

    <Note>
    `--trust` 允许本次安装执行 OpenClaw 的包生命周期脚本。Bun 1.4 及以上版本还可以运行 OpenClaw 的 CLI、本地 agent 和 Gateway。Node 仍是主运行时,因此普通的 `openclaw` 可执行文件保留其 Node shebang。`bun run --bun` 强制使用 Bun 运行时,而 `--daemon-runtime bun` 则在 Bun 下安装托管 Gateway。
    </Note>

  </Tab>
</Tabs>

### 从源码安装

适合贡献者或任何想从本地检出版本运行的人:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
corepack enable
pnpm install && pnpm build && pnpm ui:build
pnpm add --global "openclaw@link:$PWD"
openclaw onboard --install-daemon
```

`pnpm add --global "openclaw@link:$PWD"` 会把 CLI 链接到这个检出版本,且不会改动它的包文件。如果 pnpm 提示全局 bin 目录不在 `PATH` 中,请运行 `pnpm setup`,重新打开 shell 后重试。

Corepack 会按 `package.json` 选取确切的 pnpm 版本(目前是 pnpm 12)。如果 Corepack 不可用,请用 `npm install -g pnpm@12.3.4 --allow-scripts=pnpm@12.3.4` 显式安装该版本;并保持 npm 安装脚本和可选依赖开启,以便 pnpm 能配置好它的原生可执行文件。

也可以跳过全局安装,直接在仓库目录内使用 `pnpm openclaw ...`。完整的开发工作流参见 [环境搭建](/start/setup)。

### 从 GitHub main 分支检出版本安装

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 容器与包管理器

<CardGroup cols={2}>
  <Card title="Ansible" href="/install/ansible" icon="server">
    自动化批量配置主机集群。
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    可选的依赖安装器与包脚本运行器。
  </Card>
  <Card title="Docker" href="/install/docker" icon="container">
    容器化或无头(headless)部署。
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    通过 Nix flake 进行声明式安装。
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    无 root 容器方案,可替代 Docker。
  </Card>
</CardGroup>

## 验证安装

```bash
openclaw --version      # 确认 CLI 可用
openclaw doctor         # 检查配置问题
openclaw gateway status # 确认 Gateway 正在运行
```

如果希望安装后由系统托管自启动:

- macOS:通过 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 安装 LaunchAgent
- Linux/WSL2:用同样的命令安装 systemd 用户服务
- 原生 Windows:优先使用计划任务(Scheduled Task);若创建任务被拒绝,则回退为当前用户「启动」文件夹中的登录项

## 下一步:运行引导流程并连接渠道

<CardGroup cols={2}>
  <Card title="入门指南" href="/start/getting-started" icon="rocket">
    运行引导流程,安装 Gateway 服务,并打开控制台。
  </Card>
  <Card title="连接渠道" href="/channels" icon="message-square">
    通过 Telegram、Discord、Slack、WhatsApp 等与你的 agent 对话。
  </Card>
</CardGroup>

## 托管与部署

把 OpenClaw 部署到云服务器或 VPS。完整的服务商选择列表(DigitalOcean、Hetzner、Hostinger、Fly.io、GCP、Azure、Railway、Northflank、Oracle Cloud、树莓派等)参见 [Linux 服务器](/vps);也可以在 [Render](/install/render) 上进行声明式部署,或试试实验性的 [Cloudflare Containers](/install/cloudflare) 模板。

<CardGroup cols={3}>
  <Card title="Cloudflare" href="/install/cloudflare">
    实验性的 Worker + Container 部署。
  </Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">
    各方案共用的 Docker 步骤。
  </Card>
  <Card title="Kubernetes" href="/install/kubernetes">
    K8s 部署。
  </Card>
  <Card title="macOS VM" href="/install/macos-vm">
    隔离的本地或托管 macOS 部署。
  </Card>
  <Card title="Upstash Box" href="/install/upstash">
    通过 SSH 隧道访问的托管 Linux 主机。
  </Card>
  <Card title="VPS" href="/vps">
    挑选一家服务商。
  </Card>
</CardGroup>

## 备份、更新、迁移或卸载

<CardGroup cols={3}>
  <Card title="备份" href="/install/backups" icon="archive">
    创建、校验并恢复状态归档。
  </Card>
  <Card title="更新" href="/install/updating" icon="refresh-cw">
    让 OpenClaw 保持最新。
  </Card>
  <Card title="迁移" href="/install/migrating" icon="arrow-right">
    迁移到新机器。
  </Card>
  <Card title="卸载" href="/install/uninstall" icon="trash-2">
    彻底移除 OpenClaw。
  </Card>
</CardGroup>

## 故障排查:找不到 `openclaw`

几乎都是 PATH 问题:npm 的全局 bin 目录不在你 shell 的 `PATH` 里。完整修复方法(包括 Windows 路径)参见 [Node.js 故障排查](/install/node#troubleshooting)。

```bash
node -v           # Node 装了吗?
npm prefix -g     # 全局包装在哪里?
echo "$PATH"      # 全局 bin 目录在 PATH 里吗?
```
