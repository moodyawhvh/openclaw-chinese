> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "安装并配置 OpenClaw 所需的 Node.js —— 版本要求、安装方式与 PATH 问题排查"
title: "Node.js"
read_when:
  - "在安装 OpenClaw 之前需要先安装 Node.js"
  - "已安装 OpenClaw,但 `openclaw` 提示 command not found"
  - "`npm install -g` 因权限或 PATH 问题而失败"
---

OpenClaw 要求 **Node 24.16+ 或 Node 26.1+**,且其链接的 SQLite 库必须可安全执行 WAL 重置。**推荐使用 Node 26 作为运行时**——它启动 Gateway 的速度明显更快,内存占用也低于 Node 24。在缺少 Node 时,安装程序会在 macOS 上配置 Node 26,在 Linux 上配置受支持的 Node 24 LTS 系列;CI 与发布流程同样固定使用 Node 24。在基于 RPM 的 Linux 发行版上,如果发行版自带的受支持 Node 包链接的是不安全的 SQLite,安装程序会保留该系统包,并为 OpenClaw 改用用户态 Node 运行时。Node 22、23、25 均不受支持。[安装脚本](/install#recommended-installer-script)会自动检测并安装 Node——如果你想亲自配置 Node(版本、PATH、全局安装),请使用本页内容。

## 检查你的版本

```bash
node -v
```

推荐默认使用 `v26.1.0` 或更新版本。`v24.16.0` 及以上的 24.x 版本同样受支持,也是 CI 所使用的 LTS 系列。Node 22、23、25,以及 24.16.0 之前的 Node 24 和 26.1.0 之前的 Node 26 均不受支持。如果 Node 缺失或版本不在此范围内,请从下面选择一种安装方式。

在更新 OpenClaw 之前先升级 Node,以避免 SQLite TEXT 截断问题。SQLite 安全版本下限以及 macOS/ARMv7 支持限制,请参阅 [Node.js 兼容性](/install/node-compatibility)。

## 安装 Node

<Tabs>
  <Tab title="macOS">
    **Homebrew**(推荐):

    ```bash
    brew install node
    ```

    或者从 [nodejs.org](https://nodejs.org/) 下载 macOS 安装程序。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    部分发行版的 Node 包会链接系统自带的 SQLite 库。推荐的 OpenClaw 安装程序会检查实际生效的 Node 与 SQLite 组合,当发行版构建不安全时自动改用用户态 Node 运行时;它不会移除发行版的包。

    也可以使用版本管理器(见下文)。

  </Tab>
  <Tab title="Windows">
    **winget**(推荐):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    或者从 [nodejs.org](https://nodejs.org/) 下载 Windows 安装程序。

  </Tab>
</Tabs>

<Accordion title="使用版本管理器(nvm、fnm、mise、asdf)">
  版本管理器让你可以轻松切换 Node 版本。常见选择:

- [**fnm**](https://github.com/Schniz/fnm) - 快速、跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) - 在 macOS/Linux 上广泛使用
- [**mise**](https://mise.jdx.dev/) - 支持多语言(Node、Python、Ruby 等)

以 fnm 为例:

```bash
fnm install 26
fnm use 26
```

  <Warning>
  请在你的 shell 启动文件(`~/.zshrc` 或 `~/.bashrc`)中初始化版本管理器。如果跳过这一步,新终端会话中可能找不到 `openclaw`,因为 PATH 中不会包含 Node 的 bin 目录。
  </Warning>
</Accordion>

## 故障排查

### `openclaw: command not found`

这几乎总是意味着 npm 的全局 bin 目录不在你的 PATH 中。

<Steps>
  <Step title="找到你的全局 npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="检查它是否在 PATH 中">
    ```bash
    echo "$PATH"
    ```

    在输出中查找 `<npm-prefix>/bin`(macOS/Linux)或 `<npm-prefix>`(Windows)。

  </Step>
  <Step title="将其添加到 shell 启动文件">
    <Tabs>
      <Tab title="macOS / Linux">
        添加到 `~/.zshrc` 或 `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然后打开一个新终端(或在 zsh 中运行 `rehash`、在 bash 中运行 `hash -r`)。
      </Tab>
      <Tab title="Windows">
        通过「设置」→「系统」→「环境变量」,把 `npm prefix -g` 的输出添加到系统 PATH 中。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` 权限报错(Linux)

如果看到 `EACCES` 错误,请把 npm 的全局 prefix 切换到用户可写的目录:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

把 `export PATH=...` 这一行加到 `~/.bashrc` 或 `~/.zshrc` 中,使其永久生效。

## 相关页面

- [安装概览](/install) - 全部安装方式
- [更新](/install/updating) - 让 OpenClaw 保持最新
- [快速上手](/start/getting-started) - 安装后的第一步
