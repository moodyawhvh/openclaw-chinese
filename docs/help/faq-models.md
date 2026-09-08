> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "FAQ:模型默认值、选择、别名、切换、故障转移与 auth profiles"
read_when:
  - 选择或切换模型、配置别名
  - 调试模型故障转移 / "All models failed"
  - 了解 auth profiles 及其管理方式
title: "FAQ:模型与认证"
sidebarTitle: "模型 FAQ"
---

本页是关于模型与 auth profile 的问答。安装配置、会话、Gateway、频道与故障排查相关内容,请参阅主 [FAQ](/help/faq)。

## 模型:默认值、选择、别名与切换

<AccordionGroup>
  <Accordion title='什么是"默认模型"?'>
    通过以下配置项设置:

    ```text
    agents.defaults.model.primary
    ```

    模型是 `provider/model` 形式的引用(例如 `openai/gpt-5.5`、`anthropic/claude-sonnet-4-6`)。请始终显式写明 `provider/model`。如果省略 provider,OpenClaw 会先尝试别名匹配,再尝试为该模型 id 匹配唯一的已配置 provider,最后回退到配置的默认 provider(已弃用的兼容路径)。如果该 provider 已不再提供所配置的默认模型,OpenClaw 会回退到第一个已配置的 provider/model,而不是沿用过期的默认值。

  </Accordion>

  <Accordion title="推荐使用什么模型?">
    使用你的 provider 体系所能提供的最新一代最强模型,尤其是对启用了工具或需要处理不可信输入的 agent——更弱或过度量化的模型更容易遭受 prompt injection 攻击并产生不安全行为(参见[安全](/gateway/security))。可以按 agent 角色把更便宜的模型路由到日常/低风险聊天。

    按 agent 分别路由模型,并用子代理(sub-agent)并行处理长任务(每个子代理消耗各自的 token)。参见[模型](/concepts/models)、[子代理](/tools/subagents)、[MiniMax](/providers/minimax)和[本地模型](/gateway/local-models)。

  </Accordion>

  <Accordion title="如何在不弄乱配置的情况下切换模型?">
    只修改模型相关的字段——避免整份替换配置。

    - 在聊天中发送 `/model <model> -s`(仅当前会话)
    - owner/admin 发送 `/model <model> -a`(当前会话与该 agent 的默认值)
    - owner/admin 发送 `/model <model> -g`(当前会话与全局默认值)
    - `openclaw models set ...`(仅更新模型配置)
    - `openclaw configure --section model`(交互式)
    - 直接编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    不带标志的 `/model <model>` 只更改当前会话,owner/admin 也不例外,除非你显式选择更大的[模型选择作用域](/gateway/config-agents/models#agentsdefaultsmodelselectionscope)。

    通过 RPC 修改配置时,先用 `config.schema.lookup` 查看(规范化路径、浅层 schema 文档、子节点摘要),然后优先使用 `config.patch` 传入部分对象,而不是 `config.apply`。如果你确实覆盖了配置,请从备份恢复,或运行 `openclaw doctor` 修复。

    文档:[模型](/concepts/models)、[Configure](/cli/configure)、[Config](/cli/config)、[Doctor](/gateway/doctor)。

  </Accordion>

  <Accordion title="可以使用自托管模型吗(llama.cpp、vLLM、Ollama)?">
    可以——Ollama 是最简单的路径。快速设置:

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型,例如 `ollama pull gemma4`
    3. 如果还要使用云端模型,执行 `ollama signin`
    4. 运行 `openclaw onboard`,选择 `Ollama`,再选择 `Local` 或 `Cloud + Local`

    `Cloud + Local` 会在本地 Ollama 模型之外同时提供云端模型;`kimi-k2.5:cloud` 这类云端模型无需本地拉取。手动切换:先 `openclaw models list`,再 `openclaw models set ollama/<model>`。

    更小/重度量化的模型更容易遭受 prompt injection 攻击。任何拥有工具访问权限的 bot 都应使用大模型;如果仍要使用小模型,请启用沙箱和严格的工具白名单。

    文档:[Ollama](/providers/ollama)、[本地模型](/gateway/local-models)、[模型 provider](/concepts/model-providers)、[安全](/gateway/security)、[沙箱](/gateway/sandboxing)。

  </Accordion>

  <Accordion title="如何在线切换模型(无需重启)?">
    单独发送一条 `/model <name> -s` 消息,即可只切换当前会话。未带作用域标志时,将应用可选的[模型选择作用域](/gateway/config-agents/models#agentsdefaultsmodelselectionscope);保持未设置则变更只作用于当前会话,owner/admin 也不例外。完整命令列表见 [Slash commands](/tools/slash-commands),包括模型浏览(`/model`、`/models`、`/model list`)、只清除会话级模型覆盖的 `/model default -s`,以及查看端点/API 模式详情的 `/model status`。

    使用 `@profile` 为会话强制指定某个 auth profile:

    ```text
    /model opus@anthropic:default -s
    /model opus@anthropic:work -s
    ```

    不带 `@profile` 的模型选择会保留既有且兼容的 profile 固定;要替换它,请改用另一个显式的 `@profile` 后缀。可用 `/model status` 查看当前生效的 auth profile。`/model default` 会保留兼容的 auth 固定,并清除与所配置默认 provider 不匹配的那一个。

  </Accordion>

  <Accordion title="如果两个 provider 暴露相同的模型 id,/model 会用哪一个?">
    `/model provider/model` 会选中那个确切的 provider 路由。例如 `qianfan/deepseek-v4-flash` 与 `deepseek/deepseek-v4-flash` 虽然模型 id 相同,却是两个不同的引用——OpenClaw 不会仅凭裸 id 匹配就静默切换 provider。

    用户通过 `/model` 选定的引用在故障转移上是严格的:如果该 provider/model 变得不可用,回复会显式失败,而不会回退到 `agents.defaults.model.fallbacks`。已配置的 fallback 链仍适用于配置的默认值、cron 任务主模型和自动选择的 fallback 状态。当非会话覆盖的运行允许使用 fallback 时,OpenClaw 会先尝试所请求的 provider/model,再尝试已配置的 fallback,最后才是配置的主模型——因此重复的裸模型 id 绝不会直接跳回默认 provider。

    参见[模型](/concepts/models)与[模型故障转移](/concepts/model-failover)。

  </Accordion>

  <Accordion title="可以日常任务用 GPT 5.5、编码用 Codex 5.5 吗?">
    可以——模型选择与运行时选择是相互独立的:

    - **原生 Codex 编码 agent:** 把 `agents.defaults.model.primary` 设为 `openai/gpt-5.5`,并用 `openclaw models auth login --provider openai` 登录,以使用 ChatGPT/Codex 订阅认证。
    - **agent 循环之外的直接 OpenAI API 任务:** 为图像、embedding、语音、realtime 及其他非 agent 的 OpenAI API 能力配置 `OPENAI_API_KEY`。
    - **OpenAI agent 的 API key 认证:** 使用已排序的 `openai` API key profile 执行 `/model openai/gpt-5.5`。
    - **子代理:** 将编码任务路由给一个专注 Codex、且拥有自己 `openai/gpt-5.5` 模型的 agent。

    参见[模型](/concepts/models)与 [Slash commands](/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置 fast mode?">
    - **按会话:** 在使用 `openai/gpt-5.5` 时发送 `/fast on`。
    - **按模型默认值:** 将 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 设为 `true`。
    - **自动截止:** `/fast auto` 或 `params.fastMode: "auto"` 会让新的模型调用以 fast 模式运行,直到截止时间;其后的重试、fallback、工具结果或继续生成调用不再使用 fast 模式。截止时间默认 60 秒,可通过该模型上的 `params.fastAutoOnSeconds` 覆盖。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    在原生 OpenAI Responses 请求上,fast mode 会映射为 `service_tier = "priority"`;已有的 `service_tier` 值会被保留,fast mode 也不会改写 `reasoning` 或 `text.verbosity`。会话级 `/fast` 覆盖优先于配置默认值。

    参见 [Thinking and fast mode](/tools/thinking),以及 [OpenAI](/providers/openai) provider 页面 Advanced configuration 下的 Fast mode 小节。

  </Accordion>

  <Accordion title='为什么看到 "Model ... is not allowed" 之后就没有回复?'>
    如果 `agents.defaults.modelPolicy.allow` 非空,它就会成为 `/model`、会话覆盖和 `--model` 的**白名单**。选择列表之外的模型时,返回的将是下面这条信息,而不是正常回复:

    ```text
    Model override "provider/model" is not allowed by agents.defaults.modelPolicy.allow.
    ```

    修复方法:将确切的模型或 `"provider/*"` 这类 provider 通配符加入前述 `modelPolicy.allow` 列表,移除/清空该列表,或从 `/model list` 中选择模型。如果命令还带有 `--runtime codex`,请先更新白名单,再重试同一条 `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='为什么看到 "Unknown model: minimax/MiniMax-M3"?'>
    如果你用的是较旧的 OpenClaw 版本,请先升级(或从源码 `main` 运行)并重启 Gateway——你所安装版本的模型目录中可能还没有 `MiniMax-M3`。否则就是 MiniMax provider 尚未配置(找不到 provider 条目或 auth profile),导致模型无法解析。完整的修复清单、provider/model id 对照表和配置块示例,见 [MiniMax](/providers/minimax) provider 页面的 Troubleshooting 小节。

  </Accordion>

  <Accordion title="可以把 MiniMax 设为默认、复杂任务用 OpenAI 吗?">
    可以。把 MiniMax 设为默认并按会话切换模型——fallback 是为错误准备的,不是为"难题"准备的,所以请使用 `/model` 或单独的 agent。

    **方案 A:按会话切换**

    ```json5
    {
      env: { vars: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." } },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后执行 `/model gpt -s`。

    **方案 B:独立 agent**——Agent A 默认用 MiniMax,Agent B 默认用 OpenAI;按 agent 路由任务,或使用 `/agent` 切换。

    文档:[模型](/concepts/models)、[Multi-Agent Routing](/concepts/multi-agent)、[MiniMax](/providers/minimax)、[OpenAI](/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗?">
    是的——它们是内置简写,仅当目标模型存在于 `agents.defaults.models` 中时才会生效:

    | 别名 | 解析为 |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-5` |
    | `sonnet` | `anthropic/claude-sonnet-5` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    同名的自定义别名会覆盖内置别名。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式(别名)?">
    别名位于 `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    然后执行 `/model sonnet -s`,即可仅为当前会话选中该模型 ID。owner/admin 可以用 `-a` 同时更新 agent 默认值,或用 `-g` 更新共享的全局默认值。不带标志的选择遵循[模型选择作用域](/gateway/config-agents/models#agentsdefaultsmodelselectionscope)。

  </Accordion>

</AccordionGroup>

> 注:篇幅所限仅译核心章节,完整内容见原项目。
