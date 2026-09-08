> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "安装器脚本（install.sh、install-cli.sh、install.ps1）的工作原理、参数与自动化方式"
read_when:
  - 想了解 `openclaw.ai/install.sh` 的工作机制
  - 想自动化安装（CI / 无头环境）
  - 想从 GitHub checkout 安装
title: "安装器内部机制"
---

OpenClaw 提供三个安装脚本，均由 `openclaw.ai` 分发。

| 脚本                               | 平台                 | 作用                                                                                           |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，可执行 onboarding 引导。                  |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 将 Node + OpenClaw 安装到本地前缀（`~/.openclaw`），通过 npm 或 git 安装，无需 root 权限。     |
| [`install.ps1`](#installps1)       | Windows（PowerShell） | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，可执行 onboarding 引导。                  |

三个脚本均支持 Node **24.16+ 或 26.1+**，并要求其链接的 SQLite 库具备 WAL 重置安全性。缺少 Node 时，`install.sh` 在 macOS 上通过 Homebrew 安装 Node 26，在 Linux 上通过 NodeSource 安装受支持的 Node 24 LTS 版本线。当受支持的、由 RPM 管理的 Node 链接了不安全的 SQLite 时，`install.sh` 会保留发行版软件包，并通过 `install-cli.sh` 提供用户空间的 Node 运行时。免 root 的 `install-cli.sh` 会下载 Node 24.19.0；不支持 Linux ARMv7。在 Windows 上，winget/Chocolatey/Scoop 会安装受支持的 Node LTS 版本线，便携版回退方案则下载 Node 26。

在改动软件包之前，每个安装器都会探测自己将要使用的那个确切的 npm 可执行文件。npm 11.15 及更早版本正常安装；npm 11.16 及更高版本（包括 npm 12）只会对经 npm 解析出的 OpenClaw 候选标识附加 `--allow-scripts`。若 npm 版本无法读取，则会在改动软件包之前停止。若残留 `.openclaw-lifecycle-pending` 标记或旧版 `dist/openclaw-install-guard`，安装将直接失败，而不会把跳过了生命周期脚本的软件包报告为安装成功。

在 npm 12 上，从本地 `.tgz` 和 `.tar.gz` 归档进行安装或更新时，归档文件名及其父路径都不能包含逗号。npm 用逗号分隔生命周期脚本批准项，因此重试前请先把归档移到不含逗号的路径。仍然支持相对路径的 tarball 参数；安装器会解析出完整路径用于审批。

切换安装方式时，会先验证替代方案，再停用当前的持有者。源码 wrapper 采用同目录原子替换；当 npm shim 与该路径冲突时，安装器只会把标识匹配的源码 wrapper 移开，并在 npm 安装、生命周期检查或候选验证失败时将其恢复。升级时，`install.sh` 和 `install.ps1` 会运行 `openclaw doctor --fix`；修复或最终验证失败将以非零退出码结束，成功横幅只有在这些步骤全部完成后才会显示。

## 源码构建工具链

对于源码安装，安装器会在选定 checkout ref 之后选择 pnpm。
它使用 Corepack 在安装器自有的临时目录中创建 pnpm shim，
然后从 checkout 目录运行这些 shim，使 Corepack 读取该目标所固定的包管理器版本。
嵌套的安装与构建命令会让该目录排在 `PATH` 最前；
workspace 与 lockfile 相关的环境变量覆盖仅在那些子进程中绑定到目标 checkout。
环境中既有的旧版 `pnpm --version` 不是安全的选择探测手段：
其版本切换路径可能修改目标 lockfile。

如果缺少 Corepack 或无法提供所固定的版本，安装器会用选定的 npm 可执行文件
把该确切的 pnpm 版本安装到临时前缀中，并保留 npm 针对该版本的生命周期脚本批准。
随后直接使用该前缀中的可执行文件，包括嵌套命令。
这一引导过程既不会激活全局 Corepack shim，也不会更改用户的 pnpm 配置；
安装器退出后会清理临时 shim 和软件包。

此过程不会安装或替换 shell 的全局 pnpm 命令。之后手动构建前，请按照
[从源码安装](/install#from-source)选择 checkout 所固定的工具链，
而不要复用环境中较旧的启动器。

## 快捷命令

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
如果安装成功但新终端中找不到 `openclaw`，请参阅 [Node.js 故障排查](/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
推荐大多数 macOS/Linux/WSL 交互式安装使用。
</Tip>

### 安装流程（install.sh）

<Steps>
  <Step title="检测操作系统">
    支持 macOS 和 Linux（包括 WSL）。
  </Step>
  <Step title="确保有受支持的 Node.js 运行时">
    检查 Node 版本及其链接的 SQLite 库，然后在需要时安装 Node（macOS 上通过 Homebrew 的 `node` 安装 Node 26；Linux 的 apt/dnf/yum 上通过 NodeSource 安装脚本安装 Node 24 LTS）。在基于 RPM 的 Linux 上，链接了不安全 SQLite 的受支持发行版 Node 会继续保留，而 OpenClaw 改用用户空间的 Node 运行时。在 macOS 上，只有当安装器需要用 Homebrew 装 Node 或 Git 时才会安装 Homebrew。支持 Node 24.16+ 和 Node 26.1+；不支持 Node 22、23 和 25。
    在 Alpine/musl Linux 上，安装器改用 apk 软件包而非 NodeSource，并验证实际链接的 SQLite 版本。当前稳定版 Alpine 软件包源可能提供 Node 版本够新但系统 SQLite 存在漏洞的组合；遇到这种情况时，请改用官方 `node:26-alpine` 容器或基于 glibc 的主机。
  </Step>
  <Step title="确保有 Git">
    若缺少 Git，则使用检测到的包管理器安装，包括 macOS 上的 Homebrew 和 Alpine 上的 apk。
  </Step>
  <Step title="安装 OpenClaw">
    - `npm` 方式（默认）：npm 全局安装
    - `git` 方式：克隆/更新仓库，用 pnpm 安装依赖并构建，然后在 `~/.local/bin/openclaw` 安装 wrapper

  </Step>
  <Step title="安装后任务">
    - 解析刚安装的 `openclaw` 可执行文件，供后续命令使用
    - npm 前缀与守护进程状态探测默认使用 5 秒超时；已完成的探测会立即返回，不会等满该时限。
    - 对于未配置的安装，会在 doctor 或 gateway 探测之前先启动 onboarding。使用 `--no-onboard` 或无 TTY 时，会打印稍后完成配置所需的命令。
    - 对于已配置的安装，会尽力刷新并重启已加载的 gateway 服务，并运行修复版 Doctor。升级修复失败属于致命错误；插件更新失败仅作为警告。
    - 使用 `--verify` 时，会检查已安装版本，并且只在已有配置的情况下检查 gateway 健康状态。

  </Step>
</Steps>

### 源码 checkout 检测

如果在 OpenClaw checkout 目录（含 `package.json` + `pnpm-workspace.yaml`）内运行，脚本会提供以下选项：

- 使用该 checkout（`git`），或
- 使用全局安装（`npm`）

如果没有可用 TTY 且未设置安装方式，则默认采用 `npm` 并给出警告。

方式选择无效或 `--install-method` 取值非法时，脚本以退出码 `2` 退出。

使用 `--install-method git` 时，`install.sh` 和 `install-cli.sh` 可通过 `--version`
接受完整的 40 位 commit SHA。安装器会使用已存在的对象，或从 `origin`
拉取该确切的 commit，以 detached HEAD 方式检出，并以冻结的 lockfile 安装依赖。
同名分支无法顶替所请求的 commit。`--no-git-update` 只跳过分支 rebase，
并不会阻止拉取缺失的请求 commit。如果请求的对象不可用或无法解析为 commit，安装将失败。

### 示例（install.sh）

<Tabs>
  <Tab title="默认">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="跳过 onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 安装">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="试运行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="安装后验证">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="参数参考">

| 参数                                    | 说明                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 选择安装方式（默认：`npm`）                                             |
| `--npm`                                 | npm 方式的快捷参数                                                      |
| `--git \| --github`                     | git 方式的快捷参数                                                      |
| `--version <version\|dist-tag\|spec>`   | npm 版本、dist-tag 或包 spec（默认：`latest`）                          |
| `--beta`                                | 若有 beta dist-tag 则使用，否则回退到 `latest`                          |
| `--git-dir \| --dir <path>`             | checkout 目录（默认：`~/openclaw`）                                     |
| `--no-git-update`                       | 对已有 checkout 跳过 `git pull`                                         |
| `--no-prompt`                           | 禁用交互提示                                                            |
| `--no-onboard`                          | 跳过 onboarding                                                         |
| `--onboard`                             | 启用 onboarding                                                         |
| `--verify`                              | 安装后运行冒烟验证（`--version`，以及已加载时的 gateway 健康检查）      |
| `--dry-run`                             | 仅打印将执行的操作，不做任何更改                                        |
| `--verbose`                             | 启用调试输出（`set -x`、npm notice 级别日志）                           |
| `--help \| -h`                          | 显示用法                                                                |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                                              | 说明                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安装方式                                                           |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag 或包 spec                                       |
| `OPENCLAW_BETA=0\|1`                              | 有 beta 时使用                                                     |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 状态的基目录，以及默认的 git/onboarding 路径              |
| `OPENCLAW_GIT_DIR=<path>`                         | checkout 目录                                                      |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 开关 git 更新                                                      |
| `OPENCLAW_NO_PROMPT=1`                            | 禁用交互提示                                                       |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 运行安装后冒烟验证                                                 |
| `OPENCLAW_NO_ONBOARD=1`                           | 跳过 onboarding                                                    |
| `OPENCLAW_DRY_RUN=1`                              | 试运行模式                                                         |
| `OPENCLAW_VERBOSE=1`                              | 调试模式                                                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 日志级别（默认：`error`，隐藏 npm 弃用警告噪音）               |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
适用于希望所有内容都放在本地前缀（默认 `~/.openclaw`）下、
且不依赖系统 Node 的环境。默认支持 npm 安装，
也支持在同一前缀流程下进行 git checkout 安装。
</Info>

### 安装流程（install-cli.sh）

<Steps>
  <Step title="安装本地 Node 运行时">
    下载受支持的、版本固定的 Node LTS tarball（版本号内嵌在脚本中并独立更新，默认 `24.19.0`）到 `<prefix>/tools/node-v<version>`，并校验 SHA-256。
    由于官方未提供 Node 24+ 的 ARMv7 二进制文件，Linux ARMv7 会在安装开始前停止。请在兼容硬件上使用 64 位操作系统，或换用其他受支持的主机。
    在 Alpine/musl Linux 上，由于 Node 未针对固定运行时发布兼容的 tarball，会改用 `apk` 安装 `nodejs` 和 `npm`，然后同时验证 Node 与实际链接的 SQLite 库。当前稳定版 Alpine 软件包源即使 Node 版本够新，仍可能链接存在漏洞的 SQLite；当安全检查拒绝该软件包时，请使用官方 `node:26-alpine` 容器或基于 glibc 的主机。
  </Step>
  <Step title="确保有 Git">
    若缺少 Git，则在 Linux 上尝试通过 apt/dnf/yum/apk 安装，在 macOS 上通过 Homebrew 安装。
  </Step>
  <Step title="在前缀下安装 OpenClaw">
    - `npm` 方式（默认）：用 npm 安装到前缀下，然后将 wrapper 写入 `<prefix>/bin/openclaw`
    - `git` 方式：克隆/更新 checkout（默认 `~/openclaw`），wrapper 同样写入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="验证已安装的 CLI">
    运行 `<prefix>/bin/openclaw --version`，除非已安装的 wrapper 成功退出且版本号非空，
    否则报错停止。
  </Step>
  <Step title="刷新已加载的 gateway 服务">
    如果 gateway 服务已从同一前缀加载，脚本会运行
    `openclaw gateway install --force` 以激活替换后的服务，
    然后尽力探测 gateway 健康状态。
  </Step>
</Steps>

### 示例（install-cli.sh）

<Tabs>
  <Tab title="默认">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="自定义前缀 + 版本">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git 安装">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="自动化 JSON 输出">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```

  </Tab>
</Tabs>

> 注:篇幅所限仅译核心章节,完整内容见原项目。
