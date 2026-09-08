> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "如何为 OpenClaw 威胁模型做出贡献"
title: "参与完善威胁模型"
read_when:
  - 你想提交安全发现或威胁场景
  - 你在审阅或更新威胁模型
---

[威胁模型](/security/THREAT-MODEL-ATLAS) 是一份持续演进的文档。欢迎任何人参与贡献,你不需要具备安全或 MITRE ATLAS 背景。

<Note>
本页面向的是完善威胁模型,而不是报告正在发生的漏洞。如果你发现了可利用的漏洞,请改按 [Trust 页面](https://trust.openclaw.ai) 上的负责任披露指引进行报告。
</Note>

## 贡献方式

**添加威胁。** 打开一个[文档 issue](https://github.com/openclaw/openclaw/issues/new?template=docs_bug_report.yml),用自己的话描述攻击场景。以下信息有帮助但并非必需:

- 攻击场景及其可能的利用方式。
- 受影响的组件(CLI、Gateway、channels、ClawHub、MCP 服务器等)。
- 你对严重程度的估计(低 / 中 / 高 / 严重)。
- 相关研究、CVE 或真实案例的链接。

维护者会在评审过程中分配 ATLAS 映射、威胁 ID 和风险等级。

**提出缓解措施。** 打开一个引用相应威胁的 issue 或 PR。内容要具体、可执行:"在 Gateway 层对每个发送者实施每分钟 10 条消息的速率限制"就比"实现速率限制"有用得多。

**提出攻击链。** 攻击链展示的是多个威胁如何组合成一个现实场景。请描述各个步骤以及攻击者会如何将它们串联起来;一段简短的叙述胜过套用正式模板。

**修复或改进现有内容。** 错别字、表述澄清、过时信息、更好的示例:直接提交 PR 即可,无需先开 issue。

## 框架参考

威胁映射到 [MITRE ATLAS](https://atlas.mitre.org/)(Adversarial Threat Landscape for AI Systems),这是一个针对 AI/ML 特有威胁(如提示注入、工具滥用和智能体利用)的框架。你无需了解 ATLAS 也能参与贡献;维护者会在评审时为提交内容完成映射。

**威胁 ID。** 每个威胁都会获得一个形如 `T-EXEC-003` 的 ID,由维护者在评审时分配。

| 代码    | 类别                             |
| ------- | -------------------------------- |
| RECON   | 侦察 - 收集信息                  |
| ACCESS  | 初始访问 - 获取入口              |
| EXEC    | 执行 - 运行恶意操作              |
| PERSIST | 持久化 - 维持访问权限            |
| EVADE   | 防御规避 - 避免被检测            |
| DISC    | 发现 - 探测环境信息              |
| EXFIL   | 数据窃取 - 窃取数据              |
| IMPACT  | 影响 - 造成破坏或中断            |

**风险等级。** 如果你不确定等级,直接描述影响即可;维护者会进行评估。

| 等级         | 含义                                       |
| ------------ | ------------------------------------------ |
| **Critical** | 系统被完全攻陷,或高可能性 + 严重影响      |
| **High**     | 很可能造成重大损害,或中等可能性 + 严重影响 |
| **Medium**   | 中等风险,或低可能性 + 高影响              |
| **Low**      | 可能性低且影响有限                          |

## 评审流程

1. **分类** - 新提交会在 48 小时内得到评审。
2. **评估** - 维护者验证可行性,分配 ATLAS 映射和威胁 ID,并核定风险等级。
3. **文档化** - 进行格式与完整性检查。
4. **合并** - 加入威胁模型及可视化内容。

## 资源

- [ATLAS 网站](https://atlas.mitre.org/)
- [ATLAS 数据与贡献指南](https://github.com/mitre-atlas/atlas-data)

## 联系方式

- **安全漏洞:** [Trust 页面](https://trust.openclaw.ai)提供了报告指引,或发送邮件至 `security@openclaw.ai`。
- **威胁模型相关问题:** 打开一个[文档 issue](https://github.com/openclaw/openclaw/issues/new?template=docs_bug_report.yml)。
- **一般交流:** Discord `#security` 频道。

## 致谢

威胁模型的贡献者会被列入威胁模型致谢名单、发布说明,重大贡献者还会进入 OpenClaw 安全名人堂。

## 相关页面

- [威胁模型](/security/THREAT-MODEL-ATLAS)
- [事件响应](/security/incident-response)
- [形式化验证](/security/formal-verification)
