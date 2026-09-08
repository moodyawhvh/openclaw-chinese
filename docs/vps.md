> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "在 Linux 服务器或云 VPS 上运行 OpenClaw —— 服务商选择、架构与调优"
read_when:
  - 你想在 Linux 服务器或云 VPS 上运行 Gateway
  - 你需要一份托管指南的快速索引
  - 你想要适用于各类主机的通用 Linux 服务器调优
title: "Linux 服务器"
sidebarTitle: "Linux 服务器"
---

在任意 Linux 服务器或云 VPS 上运行 OpenClaw Gateway。本页帮助你挑选服务商,讲解云上部署的工作方式,并介绍适用于所有环境的通用 Linux 调优方法。

## 选择服务商

<CardGroup cols={2}>
  <Card title="Azure" href="/install/azure">Linux 虚拟机</Card>
  <Card title="Daytona" href="/install/daytona">带预览 URL 的云沙箱</Card>
  <Card title="DigitalOcean" href="/install/digitalocean">简单易用的付费 VPS</Card>
  <Card title="exe.dev" href="/install/exe-dev">带 HTTPS 代理的虚拟机</Card>
  <Card title="Fly.io" href="/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/install/hostinger">一键部署的 VPS</Card>
  <Card title="Northflank" href="/install/northflank">一键、浏览器内完成配置</Card>
  <Card title="Oracle Cloud" href="/install/oracle">永久免费的 ARM 套餐</Card>
  <Card title="Railway" href="/install/railway">一键、浏览器内完成配置</Card>
  <Card title="Raspberry Pi" href="/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS(EC2 / Lightsail / 免费套餐)**同样好用。
社区视频教程见
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(社区资源 —— 可能随时失效)。

## 云上部署的工作方式

- **Gateway 运行在 VPS 上**,并掌管状态与工作区。
- 你通过 **Control UI** 或 **Tailscale/SSH** 从笔记本或手机连接。
- 把 VPS 视为唯一事实来源,并定期**备份**状态与工作区。
- 安全默认做法:让 Gateway 只监听 loopback,并通过 SSH 隧道或 Tailscale Serve 访问。
  如果绑定到 `lan` 或 `tailnet`,Gateway 会要求共享密钥
  (`gateway.auth.token` 或 `gateway.auth.password`),除非认证已委托给
  可信代理。

相关页面:[Gateway 远程访问](/gateway/remote)、[平台总览](/platforms)。

## 先加固管理通道

在公网 VPS 上安装 OpenClaw 之前,先想好你要如何管理这台机器本身。

- 若只经 Tailnet 进行管理:先安装 Tailscale,把 VPS 加入你的 tailnet,
  通过 Tailscale IP 或 MagicDNS 名称验证第二条 SSH 会话可用,
  然后再限制公网 SSH。
- 不用 Tailscale 的话:在开放更多服务之前,先对你的 SSH 通道做同等加固。
- 这与 Gateway 访问是两回事。你仍然可以让 OpenClaw 只绑定 loopback,
  并通过 SSH 隧道或 Tailscale Serve 访问仪表盘。

Tailscale 相关的 Gateway 配置见 [Tailscale](/gateway/tailscale)。

## 在 VPS 上共用团队 Agent

当所有用户都处于同一信任边界内、且 Agent 仅用于业务时,为团队运行单个 Agent 是合理的做法。

- 把它放在专用运行环境中(VPS/虚拟机/容器 + 专用 OS 用户/账号)。
- 不要在该运行环境中登录个人 Apple/Google 账号,或个人浏览器/密码管理器配置。
- 如果用户之间互不信任,请按 gateway/主机/OS 用户拆分。

安全模型细节:[安全](/gateway/security)。

## 在 VPS 上使用 Node

你可以把 Gateway 留在云端,在你的本地设备(Mac/iOS/Android/无头设备)上配对 **node**。Node 提供本地屏幕/摄像头以及 `system.run` 能力,而 Gateway 始终留在云端。已配对的 Mac 还能在其原生面板中展示托管 widget。

文档:[Node](/nodes)、[Node CLI](/cli/nodes)。

## 小型虚拟机与 ARM 主机的启动调优

如果 CLI 命令在低功耗虚拟机(或 ARM 主机)上感觉偏慢,可以启用 Node 的模块编译缓存:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可以缩短命令重复启动的时间;首次运行会预热缓存。
- `OPENCLAW_NO_RESPAWN=1` 让常规的 Gateway 重启保持在进程内完成,避免额外的进程交接,并在小型主机上保持 PID 跟踪简单可靠。
- 树莓派专属内容见 [Raspberry Pi](/install/raspberry-pi)。

### systemd 调优清单(可选)

对于使用 `systemd` 的虚拟机主机,可以考虑:

- 通过服务环境变量固定稳定的启动路径:`OPENCLAW_NO_RESPAWN=1` 与
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 为缓慢的主机设置更长的启动超时:`TimeoutStartSec=90`。
- 托管单元已内置通用重启策略:`Restart=always`、`RestartSec=5`。
- 状态/缓存路径使用 SSD 磁盘,以减少随机 I/O 带来的冷启动开销。

标准的 `openclaw onboard --install-daemon` 流程安装的是 systemd user 单元;
只需用以下命令定制主机相关的启动设置:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
TimeoutStartSec=90
```

如果你是有意安装的 system 单元,请改用
`sudo systemctl edit openclaw-gateway.service` 编辑。

托管单元的标准内容及重启策略见 [Gateway 运行手册](/gateway)。

关于 Linux OOM 行为、子进程淘汰选择以及 `exit 137`
诊断,见 [Linux 内存压力与 OOM kill](/platforms/linux#memory-pressure-and-oom-kills)。

## 相关页面

- [安装总览](/install)
- [DigitalOcean](/install/digitalocean)
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
