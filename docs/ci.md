> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "CI 作业图、范围门控、发布大流程,以及对应的本地命令"
title: "CI 流水线"
read_when:
  - 你需要理解某个 CI 作业为什么运行了或没有运行
  - 你正在排查一条失败的 GitHub Actions 检查
  - 你正在协调一次发布验证运行或重跑
  - 你正在修改 ClawSweeper 调度或 GitHub 活动转发
---

本页是一个索引。CI 文档分布在九个页面中,每个页面对应一种阅读场景。请打开与你的任务匹配的那一页。

关于 published-upgrade 回归门控,参见[选择与路由](/ci/scope-and-routing#scope-and-routing)、[runner 预算](/ci/capacity#runner-registration-budget)以及 [Package Acceptance 基线](/ci/release-validation#suite-profiles)。每周验证列在 [Update Migration](/ci/scheduled-workflows#update-migration) 之下。

仅包含文档变更的 `main` 推送会跳过 CI。CI workflow 接纳的每一个正式 `main` 推送都会选中 published-upgrade 回归门控。

| 页面                                                           | 何时阅读                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [CI pipeline jobs](/ci/pipeline)                               | 作业表、fail-fast 顺序,以及 Control UI 体积预算。                                                                  |
| [Watch a CI run](/ci/watching-runs)                            | 等待单个 pull request head、恢复卡住的运行,以及通过证据门控。                                                       |
| [CI checkout ownership](/ci/checkout)                          | 共享 checkout 锚点、fetch 重试预算,以及可信 action 策略。                                                           |
| [CI scope and routing](/ci/scope-and-routing)                  | 某个作业为什么运行了或没运行:变更范围检测与手动 dispatch。                                                          |
| [CI runner classes](/ci/runners)                               | 基于信任的 runner 路由、Blacksmith 类别,以及 runner 后端模式。                                                      |
| [CI capacity and shard weights](/ci/capacity)                  | runner 注册预算,以及 shard 打包背后的实测耗时。                                                                     |
| [Release validation workflows](/ci/release-validation)         | 完整 Release Validation、live 与 E2E shard、Package Acceptance、安装冒烟测试、Docker E2E,以及 Plugin Prerelease。    |
| [Scheduled and maintenance workflows](/ci/scheduled-workflows) | OpenClaw Performance、QA Lab、CodeQL、各维护作业,以及 ClawSweeper 活动转发。                                        |
| [Local checks and Testbox](/ci/local-proof)                    | 在本地复现一条 lane、守住 shrink-only ratchet,以及运行 Crabbox 或 Testbox 验证。                                    |

## 各章节去向

旧单页版本中的每个章节标题在这里都保留了锚点,因此诸如 `/ci#pipeline-overview` 之类的既有链接仍然可以解析。每个条目都指向现在承载该内容的页面。

- <a id="pipeline-overview" />[流水线概览](/ci/pipeline#pipeline-overview)
- <a id="fail-fast-order" />[Fail-fast 顺序](/ci/pipeline#fail-fast-order)
- <a id="control-ui-size-budgets" />[Control UI 体积预算](/ci/pipeline#control-ui-size-budgets)
- <a id="watching-pull-request-ci" />[观察 pull request CI](/ci/watching-runs#watching-pull-request-ci)
- <a id="recover-an-existing-pr-run-first" />[优先恢复已有的 PR 运行](/ci/watching-runs#recover-an-existing-pr-run-first)
- <a id="pr-context-and-evidence" />[PR 上下文与证据](/ci/watching-runs#pr-context-and-evidence)
- <a id="checkout-ownership" />[Checkout 归属](/ci/checkout#checkout-ownership)
- <a id="scope-and-routing" />[范围与路由](/ci/scope-and-routing#scope-and-routing)
- <a id="measured-shard-weights" />[实测 shard 权重](/ci/capacity#measured-shard-weights)
- <a id="clawsweeper-activity-forwarding" />[ClawSweeper 活动转发](/ci/scheduled-workflows#clawsweeper-activity-forwarding)
- <a id="manual-dispatches" />[手动 dispatch](/ci/scope-and-routing#manual-dispatches)
- <a id="windows-testbox-probe" />[Windows Testbox Probe](/ci/scope-and-routing#windows-testbox-probe)
- <a id="runners" />[Runner](/ci/runners#runners)
- <a id="blacksmith-runner-capacity" />[Blacksmith runner 容量](/ci/runners#blacksmith-runner-capacity)
- <a id="runner-backend-modes" />[Runner 后端模式](/ci/runners#runner-backend-modes)
- <a id="runner-registration-budget" />[Runner 注册预算](/ci/capacity#runner-registration-budget)
- <a id="surface-ratchets" />[Surface ratchet](/ci/local-proof#surface-ratchets)
- <a id="local-equivalents" />[本地等价命令](/ci/local-proof#local-equivalents)
- <a id="openclaw-performance" />[OpenClaw Performance](/ci/scheduled-workflows#openclaw-performance)
- <a id="vitest-paired-benchmark" />[Vitest 成对基准测试](/ci/scheduled-workflows#vitest-paired-benchmark)
- <a id="full-release-validation" />[完整 Release Validation](/ci/release-validation#full-release-validation)
- <a id="live-and-e2e-shards" />[Live 与 E2E shard](/ci/release-validation#live-and-e2e-shards)
- <a id="package-acceptance" />[Package Acceptance](/ci/release-validation#package-acceptance)
- <a id="jobs" />[作业](/ci/release-validation#jobs)
- <a id="candidate-sources" />[候选来源](/ci/release-validation#candidate-sources)
- <a id="suite-profiles" />[套件 profiles](/ci/release-validation#suite-profiles)
- <a id="legacy-compatibility-windows" />[遗留兼容窗口](/ci/release-validation#legacy-compatibility-windows)
- <a id="examples" />[示例](/ci/release-validation#examples)
- <a id="install-smoke" />[安装冒烟测试](/ci/release-validation#install-smoke)
- <a id="local-docker-e2e" />[本地 Docker E2E](/ci/release-validation#local-docker-e2e)
- <a id="tunables" />[可调参数](/ci/release-validation#tunables)
- <a id="reusable-livee2e-workflow" />[可复用的 live/E2E workflow](/ci/release-validation#reusable-live/e2e-workflow)
- <a id="release-path-chunks" />[发布路径分块](/ci/release-validation#release-path-chunks)
- <a id="plugin-prerelease" />[Plugin Prerelease](/ci/release-validation#plugin-prerelease)
- <a id="qa-lab" />[QA Lab](/ci/scheduled-workflows#qa-lab)
- <a id="codeql" />[CodeQL](/ci/scheduled-workflows#codeql)
- <a id="security-categories" />[安全类别](/ci/scheduled-workflows#security-categories)
- <a id="platform-specific-security-shards" />[平台专属安全 shard](/ci/scheduled-workflows#platform-specific-security-shards)
- <a id="critical-quality-categories" />[Critical Quality 类别](/ci/scheduled-workflows#critical-quality-categories)
- <a id="maintenance-workflows" />[维护类 workflow](/ci/scheduled-workflows#maintenance-workflows)
- <a id="dependency-audit" />[依赖审计](/ci/scheduled-workflows#dependency-audit)
- <a id="docs-agent" />[Docs Agent](/ci/scheduled-workflows#docs-agent)
- <a id="duplicate-prs-after-merge" />[合并后的重复 PR](/ci/scheduled-workflows#duplicate-prs-after-merge)
- <a id="local-check-gates-and-changed-routing" />[本地检查门控与变更路由](/ci/local-proof#local-check-gates-and-changed-routing)
- <a id="config-baseline-count-ratchet" />[Config 基线数量 ratchet](/ci/local-proof#config-baseline-count-ratchet)
- <a id="testbox-validation" />[Testbox 验证](/ci/local-proof#testbox-validation)

## 相关页面

- [安装概览](/install)
- [发布渠道](/install/development-channels)
