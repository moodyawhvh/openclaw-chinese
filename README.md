<div align="center">

# openclaw 中文翻译版

**[中文版] openclaw — 开源个人 AI 助手,运行在你自己的设备上,通过聊天软件与你对话**

[![原项目](https://img.shields.io/badge/原项目-openclaw--openclaw-blue?style=flat-square&logo=github)](https://github.com/openclaw/openclaw)
[![中文文档](https://img.shields.io/badge/中文文档-README.zh--CN.md-orange?style=flat-square)](README.zh-CN.md)
[![GitHub Stars](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&label=原项目Stars)](https://github.com/openclaw/openclaw/stargazers)
[![微信联系](https://img.shields.io/badge/微信-uaycar-brightgreen?style=flat-square&logo=wechat)](#)

</div>

---

> 这是 [openclaw/openclaw](https://github.com/openclaw/openclaw) 的中文翻译版本。
> 完整源代码请访问原项目:https://github.com/openclaw/openclaw

**代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

---

## 📖 项目简介

OpenClaw 是一个开源的 AI 个人助手,直接运行在你自己的电脑上,并接入你日常已经在用的聊天渠道:WhatsApp、Telegram、Discord、Slack、iMessage、Teams 等 20 多种,同时提供 macOS、iOS、Android、Windows、Linux 原生应用。一个 Gateway(网关)既可以作为笔记本上的私人助理运行,也可以部署为团队共享实例——两者只差配置。数据、记忆和凭证全部保存在你自己的硬件上,模型(Claude、Codex、本地模型等)只是可随时替换的插件,项目由独立的 OpenClaw 基金会维护,没有付费版、托管服务或代币。

## ✨ 主要特性

- **数据完全自持**:状态、记忆、凭证都留在你自己的设备上,默认几乎不对外发送任何遥测数据
- **全平台覆盖**:支持 macOS、Linux、Windows 安装,并提供 iOS / Android 原生应用
- **多渠道接入**:WhatsApp、Telegram、Discord、Slack、iMessage、Signal、Google Chat 等 20+ 聊天平台
- **模型可插拔**:Claude、Codex、本地模型等作为插件热切换,无需改动其他配置
- **Gateway 架构**:本地控制平面统一管理会话、工具、事件与渠道连接
- **工具 / 技能 / 插件生态**:通过插件 SDK 扩展能力,经由 ClawHub 分享
- **安全模型清晰**:入站消息视为不可信输入,支持消息配对审批与沙箱化执行
- **开源免费**:MIT 许可证,由独立 501(c)(3) 基金会运营,无付费层级

## 📁 文件说明

| 文件 | 说明 |
|:-----|:-----|
| README.md | 本文件(中文简介) |
| README.zh-CN.md | 详细中文文档(完整汉化) |

## 🚀 快速开始

**1. 安装**(安装器支持 macOS / Linux / Windows,会自动准备所需的 Node.js 运行时):

```bash
# macOS / Linux / WSL2
curl -fsSL https://openclaw.ai/install.sh | bash
```

```powershell
# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

**2. 已有 Node.js 环境**(Node 24.16+ 或 26.1+)可直接装 npm 包:

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

**3. 初始化引导**(全新安装时安装脚本会自动启动引导向导;直接用 npm 装的运行下面命令):

```bash
openclaw onboard --install-daemon
```

**4. 检查状态并打开控制台**:

```bash
openclaw gateway status
openclaw dashboard
```

**5. 完成引导后**:引导流程会校验模型访问、创建工作区并配置 Gateway,最后一条命令会打开 Control UI,在里面发一条消息确认助手正常工作。

**6. 接入聊天渠道**:参考原项目文档配置 WhatsApp / Telegram / Discord 等渠道。

**7. 二次开发**:仓库是 pnpm workspace,不要在根目录直接 `npm install`:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
```

完整源代码与最新版本请访问原项目:https://github.com/openclaw/openclaw

## 📞 联系方式

**代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

---

本项目为 [openclaw/openclaw](https://github.com/openclaw/openclaw) 的中文翻译版本,所有代码版权归原项目作者所有,遵循其原始许可证。

**如果觉得有用,请给原项目点个 Star!** ⭐
