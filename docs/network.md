> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译，英文原版见原项目。

---
summary: "网络枢纽：Gateway 服务入口、配对、发现与安全"
read_when:
  - 你需要了解网络架构与安全概览
  - 你在调试本地与 tailnet 访问或配对问题
  - 你想要网络相关文档的权威清单
title: "网络"
---

本枢纽页汇总了核心文档，说明 OpenClaw 如何在 localhost、LAN 与 tailnet 之间连接、配对并保护各设备。

## 核心模型

大多数操作都会经由 Gateway（`openclaw gateway`）完成——这是一个长期运行的单进程，负责掌管各渠道连接以及 WebSocket 控制面。

- **环回优先**：Gateway WebSocket 默认使用 `ws://127.0.0.1:18789`。如果没有有效的 Gateway 认证路径——共享密钥 token/密码认证，或配置正确的非环回 `trusted-proxy` 部署——非环回绑定将拒绝启动。
- 推荐每台主机只运行**一个 Gateway**。如需隔离，可使用相互隔离的 profile 和端口运行多个 Gateway（[多个 Gateway](/gateway/multiple-gateways)）。
- **托管的 widget 文档与 A2UI 渲染资源**通过与 Gateway 相同的端口提供（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），绑定到环回之外时受 Gateway 认证保护。
- **远程访问**通常通过 SSH 隧道或 Tailscale VPN 实现（[远程访问](/gateway/remote)）。

关键参考文档：

- [Gateway 架构](/concepts/architecture)
- [Gateway 协议](/gateway/protocol)
- [Gateway 运行手册](/gateway)
- [Web 界面 + 绑定模式](/web)

## 配对与身份

- [配对概览（DM + 节点）](/channels/pairing)
- [Gateway 管理的节点配对](/gateway/pairing)
- [Devices CLI（配对 + token 轮换）](/cli/devices)
- [Pairing CLI（DM 审批）](/cli/pairing)

本地信任：

- 来自本机环回的直接连接（不含转发/代理头）可以自动批准配对，让同主机场景的使用体验保持顺畅。
- OpenClaw 还为受信任的共享密钥 helper 流程保留了一条受限的后端/容器本地自连接路径。
- tailnet 与 LAN 客户端（包括同主机的 tailnet 绑定）仍需显式的配对批准。

## 发现与传输

- [发现与传输](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [远程访问（SSH）](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 节点与传输

- [节点概览](/nodes)
- [节点运行手册：iOS](/platforms/ios)
- [节点运行手册：Android](/platforms/android)

## 安全

- [安全概览](/gateway/security)
- [Gateway 配置参考](/gateway/configuration)
- [故障排查](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)

## 相关文档

- [Gateway 运行手册](/gateway)
- [远程访问](/gateway/remote)
