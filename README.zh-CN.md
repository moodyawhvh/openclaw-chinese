<div align="center">

# openclaw 中文文档

[![原项目](https://img.shields.io/badge/原项目-openclaw--openclaw-blue?style=flat-square&logo=github)](https://github.com/openclaw/openclaw)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE)
[![微信联系](https://img.shields.io/badge/微信-uaycar-brightgreen?style=flat-square&logo=wechat)](#)

**OpenClaw — 你自己的 AI 助手,跑在你的设备上,活在你的聊天里。**

</div>

---

> 本文档是 [openclaw/openclaw](https://github.com/openclaw/openclaw) 官方 README 的中文翻译版本,仅供学习参考,如有出入以英文原文为准。
>
> **代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

## 项目简介

OpenClaw 是一个开源 AI 助手,运行在你自己的计算机上,并出现在你日常使用的聊天渠道中:Discord、iMessage、Slack、Teams、Telegram、WhatsApp 等 20 多种平台,同时为 macOS、iOS、Android、Windows 和 Linux 提供原生应用。一个 Gateway(网关)既可以作为笔记本上的私人助理运行,也可以作为团队共享部署使用——两者的区别仅仅是配置。

**完全属于你,没有任何猫腻。** 状态、记忆和凭证都保存在你自己的硬件上。模型与代理框架(Claude、Codex、本地模型)是可插拔的插件,替换时不需要改动其他任何东西。你的提示词只会发送给你配置的模型服务商和聊天平台,以及你主动开启的诊断导出;默认情况下 OpenClaw 自己只做一次每日版本检查,匿名功能统计是可选加入的,设置 `update.checkOnStart: false` 可以把两者都关掉。

OpenClaw 由独立的 501(c)(3) 非营利组织 [OpenClaw Foundation](https://openclaw.org) 运营,没有付费版本、托管服务或代币。其"可信网关、不可信执行、确定性策略"的架构论证见原项目文档 Why OpenClaw。

相关链接:[官网](https://openclaw.ai) · [文档](https://docs.openclaw.ai) · [入门指南](https://docs.openclaw.ai/start/getting-started) · [常见问题](https://docs.openclaw.ai/help/faq)

## 主要特性

- **自托管**:整个助手运行在你控制的硬件上,没有云端依赖
- **全渠道**:覆盖 WhatsApp、Telegram、Discord、Slack、iMessage、Signal、Google Chat 等 20+ 聊天平台
- **全平台**:macOS、Linux、Windows 服务端 + iOS / Android 原生客户端
- **模型无关**:Claude、Codex、本地模型均为插件,可随时切换
- **可扩展**:工具(Tools)、技能(Skills)、插件(Plugins)三层扩展体系,插件经 ClawHub 分发
- **注重隐私**:默认无遥测上传,统计数据需主动开启
- **基金会治理**:独立非营利组织运营,开源免费(MIT 许可证)

## 安装

安装器支持 macOS、Linux 和 Windows,并会在需要时自动准备受支持的 Node.js 运行时。

```bash
# macOS / Linux / WSL2
curl -fsSL https://openclaw.ai/install.sh | bash
```

```powershell
# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

已经在自己管理 Node.js?可以直接安装发布的 npm 包(Node 24.16+ 或 26.1+):

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

该命令适用于 npm 12 或 npm 11.16+;在 npm 11.15 及更早版本上,请去掉 `--allow-scripts=openclaw`。生命周期脚本约定、Docker、Nix 以及其他部署方式请参阅原项目安装指南:https://docs.openclaw.ai/install

## 快速开始

全新安装时,安装脚本会自动启动引导(onboarding)流程,完成打开的向导即可。如果是用 npm、pnpm 或 Bun 直接安装的包,请运行:

```bash
openclaw onboard --install-daemon
```

引导完成后:

```bash
openclaw gateway status
openclaw dashboard
```

引导过程会校验模型访问、创建工作区并配置 Gateway。最后一条命令会打开 Control UI(控制界面),在那里发送一条消息即可确认助手工作正常。渠道配置与故障排查详见原项目入门指南:https://docs.openclaw.ai/start/getting-started

## 整体架构

- [Gateway(网关)](https://docs.openclaw.ai/gateway) 是本地的控制平面,负责会话、工具、事件与渠道连接
- [Control UI](https://docs.openclaw.ai/web/control-ui)、CLI 和 [TUI](https://docs.openclaw.ai/web/tui) 都连接到 Gateway
- [渠道(Channels)](https://docs.openclaw.ai/channels) 把助手带到 WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage 等聊天服务
- [伴侣应用与节点(Companion apps & nodes)](https://docs.openclaw.ai/platforms) 在受支持的平台上提供语音、Canvas、摄像头、屏幕和设备本地操作能力

OpenClaw 同时支持托管与本地[模型服务商](https://docs.openclaw.ai/concepts/model-providers)。它的[工具](https://docs.openclaw.ai/tools)、[技能](https://docs.openclaw.ai/tools/skills)和[插件](https://docs.openclaw.ai/plugins)体系扩展了助手的能力边界。

## 安全须知

请把所有入站消息当作不可信输入。支持私聊的渠道默认会对未知发送者发起配对,使用 `openclaw pairing approve <channel> <code>` 审批配对请求。

除非你配置了沙箱,工具默认在主机上为主会话直接运行。在接入其他用户或把 Gateway 暴露到远程之前,务必阅读原项目的安全指南(https://docs.openclaw.ai/gateway/security)、暴露处置手册与沙箱指南(https://docs.openclaw.ai/gateway/sandboxing)。

## 文档导航

| 目标 | 入口 |
|:-----|:-----|
| 配置模型与鉴权 | [Models](https://docs.openclaw.ai/concepts/models) · [Model providers](https://docs.openclaw.ai/concepts/model-providers) |
| 接入聊天服务 | [Channels](https://docs.openclaw.ai/channels) |
| 添加工具、技能与插件 | [Tools](https://docs.openclaw.ai/tools) · [Skills](https://docs.openclaw.ai/tools/skills) · [Plugins](https://docs.openclaw.ai/plugins) · [ClawHub](https://clawhub.ai) |
| 运行应用与设备节点 | [Platforms](https://docs.openclaw.ai/platforms) · [Nodes](https://docs.openclaw.ai/nodes) |
| 使用 CLI 与聊天命令 | [CLI 参考](https://docs.openclaw.ai/cli) · [斜杠命令](https://docs.openclaw.ai/tools/slash-commands) |
| 配置或运维 Gateway | [Configuration](https://docs.openclaw.ai/gateway/configuration) · [Architecture](https://docs.openclaw.ai/concepts/architecture) · [Updating](https://docs.openclaw.ai/install/updating) |

## 开发

本仓库是 pnpm workspace,不支持在仓库根目录直接运行 `npm install`:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
```

贡献流程见原项目 CONTRIBUTING.md,开发环境的搭建循环见源码设置指南:https://docs.openclaw.ai/start/setup

## 治理与社区

OpenClaw 由 [OpenClaw Foundation](https://openclaw.org)(独立 501(c)(3) 组织)公开开发,基金会雇佣核心团队并签署发布版本,捐赠方与基础设施赞助方都不拥有或主导项目。项目最初由 Peter Steinberger 与社区为太空龙虾 AI 助手 Molty 而构建。

提交缺陷或功能请求请使用原项目的 issue 入口,安装问题可在 [Discord](https://discord.gg/clawd) 提问,漏洞请通过 SECURITY.md 报告。新能力通常应以[插件 SDK](https://docs.openclaw.ai/plugins/building-plugins) 构建插件的形式实现,并经由 [ClawHub](https://clawhub.ai) 分享。欢迎 AI 辅助的 PR。

---

## 版权声明

本中文文档为 [openclaw/openclaw](https://github.com/openclaw/openclaw) 的翻译版本,原项目所有代码与英文文档的版权归原项目作者及 OpenClaw Foundation 所有,遵循 MIT 许可证发布。翻译内容同样以 MIT 许可证精神共享,仅作中文社区学习交流之用。

**代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

**如果本项目对你有帮助,请给原项目 [openclaw/openclaw](https://github.com/openclaw/openclaw) 点一个 Star!** ⭐
