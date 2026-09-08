> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "OpenClaw 可选的基于 Docker 的安装与引导流程"
read_when:
  - 你想要一个容器化的 Gateway,而不是本地安装
  - 你正在验证 Docker 流程
  - 你正在从 ClawDock shell 辅助脚本迁移
title: "Docker"
---

Docker 是**可选**的。它适合用来获得一个隔离、用完即弃的 Gateway 环境,或者用于不希望本地安装的主机。如果你已经在本机上进行开发,请改用常规安装流程。

默认的 Docker 沙箱后端只使用 `docker` CLI。将后端设置为 `"podman"` 即可直接选用原生 Podman。沙箱默认关闭,也不要求 Gateway 本身运行在容器里。此外还提供 SSH 和 OpenShell 沙箱后端;参见[沙箱机制](/gateway/sandboxing)。

需要托管多个用户?参见[多租户托管](/gateway/multi-tenant-hosting)了解每租户一个 cell 的模型。

## 前提条件

- Docker Desktop(或 Docker Engine)+ Docker Compose v2
- 本地源码镜像构建至少需要 6 GB 内存;使用预构建镜像可避免这一构建要求
- 足够的磁盘空间存放镜像和日志
- 在 VPS/公网主机上,请阅读[面向网络暴露的安全加固](/gateway/security),尤其是 Docker 的 `DOCKER-USER` 防火墙链

## 容器化 Gateway

<Steps>
  <Step title="构建镜像">
    在仓库根目录执行:

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地把 Gateway 镜像构建为 `openclaw:local`。若要改用预构建镜像:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像会首先发布到 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。GHCR 是发布自动化、固定版本部署和来源校验的主镜像仓库。同一次发布还会在 Docker Hub 上发布镜像 `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    请使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`,避免非官方镜像源——它们的发布节奏和保留策略与 OpenClaw 并不一致。版本专属标签既包括正式版本(如 `2026.2.26`),也包括预发布版本(如 `2026.2.26-beta.1`)。稳定版会移动 `latest` 和 `main` 标签;非当月发布的 Gateway 版本仅移动 `extended-stable`。变体包括 `slim`、`main-slim`、`extended-stable-slim`、`latest-browser`、`main-browser` 和 `extended-stable-browser`。默认镜像内置 `codex` 和 `diagnostics-otel` 插件。`-browser` 变体还预先打包了 Chromium,适合直接使用[沙箱浏览器](/gateway/sandboxing#sandboxed-browser)工具,无需首次运行时安装 Playwright。

  </Step>

  <Step title="离线环境重跑">
    在离线主机上,先传输并加载镜像:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 会先验证 `OPENCLAW_IMAGE` 已存在于本地,禁用 Compose 的隐式拉取/构建,然后执行正常流程:`.env` 同步、权限修复、引导配置、Gateway 配置同步、Compose 启动。

    如果设置了 `OPENCLAW_SANDBOX=1`,离线安装还会检查 `OPENCLAW_DOCKER_SOCKET` 所指向守护进程上已配置的默认及各 agent 沙箱镜像,包括 Docker 后端浏览器镜像上的 browser-contract 标签。若所需镜像缺失或过期,安装脚本会直接退出且不改动沙箱配置,而不是报出一个看似成功实则损坏的结果。

  </Step>

  <Step title="完成引导配置">
    安装脚本会自动运行引导配置(onboarding):

    - 提示输入各提供商的 API key
    - 生成 Gateway token 并写入 `.env`
    - 创建旧版 auth-profile 密钥目录
    - 通过 Docker Compose 启动 Gateway

    启动前的引导配置和配置写入直接通过 `openclaw-gateway` 执行(带 `--no-deps --entrypoint node`),因为 `openclaw-cli` 与 Gateway 共享网络命名空间,只有在 Gateway 容器存在之后才能工作。

  </Step>

  <Step title="打开 Control UI">
    打开 `http://127.0.0.1:18789/`,把写入 `.env` 的 token 粘贴到 Settings 中。如果你把容器切换成了密码认证,则改用该密码。

    需要再次获取 URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果使用了自定义的 `OPENCLAW_GATEWAY_PORT`,在浏览器打开之前,请把输出 URL 中的端口 `18789` 替换为你的主机端口,URL 其余部分保持不变。任一容器内的 dashboard 命令都使用内部监听端口。

  </Step>

  <Step title="配置渠道(可选)">
    ```bash
    # WhatsApp(扫码)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文档:[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)

  </Step>
</Steps>

### 无头(Headless)引导

对于无人值守的容器主机,把提供商、Gateway 和渠道凭据放进 Compose 的 `.env` 文件,让一次性引导容器和长期运行的 Gateway 拿到相同的值:

```bash
OPENAI_API_KEY=<provider-key>
OPENCLAW_GATEWAY_TOKEN=<gateway-token>
TELEGRAM_BOT_TOKEN=<bot-token>
```

在没有伪 TTY 的情况下运行引导和渠道配置,然后启动 Gateway:

```bash
docker compose run -T --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --non-interactive --accept-risk --skip-health \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --skip-channels \
  --no-install-daemon
docker compose run -T --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js channels add --channel telegram --use-env
docker compose up -d openclaw-gateway
```

如果插件声明的环境变量缺失,渠道命令会在改动配置之前直接失败。引导完成后请把 `TELEGRAM_BOT_TOKEN` 保留在 `.env` 中:`--use-env` 把凭据查找交给环境而不把 token 复制进 `openclaw.json`,而且运行中的 Gateway 也需要同一个变量。启动之后若渠道配置发生变化,Gateway 的配置监视器会自动热重载受影响的渠道。

参见 [`openclaw channels`](/cli/channels) 了解凭据命令行参数的替代方案以及其他渠道插件。

### 手动流程

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Docker 构建上下文排除了 `.git`。如上所示,把源码标识作为构建参数传入,镜像的 About 界面才能报告检出的 commit 和统一的构建时间戳。`scripts/docker/setup.sh` 会自动解析并传入这两个值。

<Note>
请在仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`,安装脚本会生成 `docker-compose.extra.yml`;请把它放在你自己维护的任何 `docker-compose.override.yml` 之后,例如 `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### 升级容器镜像

当你替换 OpenClaw 镜像但保留相同的挂载状态/配置时,新的 Gateway 会在就绪之前执行启动安全的升级迁移和插件收敛。常规镜像升级不应需要单独跑一遍 `openclaw doctor --fix`。

如果启动时无法安全完成这些修复,Gateway 会直接退出而不是报告健康。配置了重启策略时,Docker、Podman 或 Kubernetes 可能显示 Gateway 容器不断重启。请保留挂载的状态卷,然后用同一镜像以 `openclaw doctor --fix` 作为容器命令运行一次,并挂载与 Gateway 相同的状态/配置:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

doctor 结束后,用默认命令重启 Gateway 容器。在 Kubernetes 中,在挂载同一 PVC 的一次性 Job 或调试 Pod 里运行相同命令,然后重启 Deployment 或 StatefulSet。

容器恢复运行后,针对同一挂载状态运行只读的部署预检:

```bash
docker compose run --rm openclaw-cli doctor --json
```

### 环境变量

`scripts/docker/setup.sh` 接受的可选变量(Gateway 容器方面,`docker-compose.yml` 也直接接受这些变量):

| 变量                                            | 用途                                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 使用远程镜像而不是本地构建                                                                                        |
| `OPENCLAW_GATEWAY_PORT`                         | 主机发布的 Gateway 端口(默认 `18789`);两个容器内部均保持端口 `18789`                                             |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 构建期间安装额外的 apt 包(空格分隔)。旧别名:`OPENCLAW_DOCKER_APT_PACKAGES`                                       |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 构建期间安装额外的 Python 包(空格分隔)                                                                          |
| `OPENCLAW_EXTENSIONS`                           | 编译/打包所选的受支持插件并安装其运行时依赖(逗号或空格分隔的 id)                                                 |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 覆盖本地源码构建的 Node 选项(默认 `--max-old-space-size=8192`)                                                    |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 以 MB 为单位覆盖本地源码构建的 tsdown 堆大小                                                                      |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 在仅运行时的本地镜像构建中跳过类型声明输出(默认 `1`)                                                             |
| `OPENCLAW_INSTALL_BROWSER`                      | 构建时把 Chromium + Xvfb 烘焙进镜像                                                                               |
| `OPENCLAW_EXTRA_MOUNTS`                         | 额外的宿主机 bind mount(逗号分隔的 `source:target[:opts]`)                                                       |
| `OPENCLAW_HOME_VOLUME`                          | 将 `/home/node` 持久化到命名的 Docker 卷                                                                          |
| `OPENCLAW_TZ`                                   | 将 Gateway 和 CLI 容器的时区设为 IANA 名称(默认 `UTC`)                                                           |
| `OPENCLAW_SANDBOX`                              | 选择启用沙箱引导(`1`、`true`、`yes`、`on`)                                                                        |
| `OPENCLAW_SKIP_ONBOARDING`                      | 跳过交互式引导步骤(`1`、`true`、`yes`、`on`)                                                                      |
| `OPENCLAW_DOCKER_SOCKET`                        | 覆盖 Docker socket 路径                                                                                            |
| `OPENCLAW_DISABLE_BONJOUR`                      | 强制开启(`0`)或关闭(`1`)Bonjour/mDNS 广播;参见 [Bonjour / mDNS](/install/docker#bonjour-%2F-mdns)                |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 禁用内置插件源码 bind-mount 覆盖                                                                                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry 导出共用的 OTLP/HTTP collector 端点                                                                  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | 按信号(traces、metrics、logs)指定的 OTLP 端点                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | 共享的 OTLP 协议回退。目前仅支持 `http/protobuf`                                                                   |
| `OTEL_EXPORTER_OTLP_*_PROTOCOL`                 | 按信号指定的协议回退,优先于共享回退                                                                               |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry 资源使用的服务名                                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 选择加入最新的实验性 GenAI 语义属性                                                                                |
| `OPENCLAW_OTEL_PRELOADED`                       | 已预加载 OpenTelemetry SDK 时,跳过启动第二个 SDK                                                                  |

修改 `.env` 或 Compose 环境设置后,请运行 `docker compose up -d openclaw-gateway` 以使用新值重建 Gateway。`docker compose restart` 不会应用环境变更。

官方镜像不含 Homebrew。在没有 `brew` 的 Linux 容器中,引导期间 OpenClaw 会隐藏仅限 brew 的技能依赖安装器;这些依赖请通过自定义镜像提供或手动安装。Debian 打包的依赖使用 `OPENCLAW_IMAGE_APT_PACKAGES`,Python 依赖使用 `OPENCLAW_IMAGE_PIP_PACKAGES`(构建时会执行 `python3 -m pip install --break-system-packages`,因此请固定版本并只使用你信任的索引)。

如果 Docker 报告 `ResourceExhausted`、`cannot allocate memory`,或在 `tsdown` 期间中止,请提高 Docker 构建器的内存限制,或改用更小的显式堆重试:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

显式的 tsdown 堆覆盖也是在低于自动检测的安全最小值时尝试构建的受支持途径。该尝试可能卡住或失败。

### 源码构建带指定插件的镜像

`OPENCLAW_EXTENSIONS` 从源码检出中选择插件 manifest id;如果现有源码目录名与 id 不一致,也同样接受目录名。Docker 构建会把所选内容一次性解析到源码目录,安装生产依赖,把每个所选插件自身的运行时依赖链接到其在 `/app/dist/extensions/<id>` 下的打包根目录中,并把所选插件的运行时包含进镜像。源码构建也会编译通过 `openclaw.build.bundledDist: false` 单独另行发布的第一方插件;该标记仍保留插件在外部 npm 或 ClawHub 上的归属,不会改变任何一种制品契约。未知、无效或含糊的 id 会导致镜像构建失败。
这同样适用于 WhatsApp:`OPENCLAW_EXTENSIONS=whatsapp` 会编译并打包其运行时。普通源码构建通过单独的外部插件构建路径生成其运行时;根 npm 制品继续将其排除在外。所选插件必须能成功编译;未选中的外部插件源码及其运行时输出会被剪除。

例如,以下命令为 ClickClack、Slack 和 Microsoft Teams 构建相互独立的多架构 standalone FakeCo Gateway 镜像。ClawRouter 已经是根 OpenClaw 运行时的一部分,因此 ClickClack 镜像只选择 `clickclack`。显式的空 browser 参数可保持默认镜像不含 Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}
```

> 注:篇幅所限仅译核心章节,完整内容见原项目。
