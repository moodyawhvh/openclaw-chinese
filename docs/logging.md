> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "文件日志、控制台输出、CLI 实时跟踪,以及 Control UI 的 Logs 标签页"
read_when:
  - 你需要一份面向初学者的 OpenClaw 日志总览
  - 你想配置日志级别、格式或脱敏(redaction)
  - 你正在排查问题,需要快速找到日志
title: "日志"
---

OpenClaw 有两个主要的日志呈现面:

- 由 Gateway 写入的**文件日志**(JSON lines)。
- 运行 Gateway 的终端中的**控制台输出**。

Control UI 的 **Logs** 标签页会实时跟踪(tail)gateway 的文件日志。本页介绍日志存放在哪里、如何阅读,以及如何配置日志级别和格式。

## 日志存放位置

默认情况下,Gateway 每天写入一个按天滚动的日志文件。默认 profile 沿用历史路径:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

命名 profile 会在同一目录下使用带 profile 限定的文件名:

`/tmp/openclaw/openclaw-<profile>-YYYY-MM-DD.log`

文件名中的 profile 段为小写,且仅限字母、数字和连字符。简单的小写名称保持可读,因此 `--dev` 简写会写入 `openclaw-dev-YYYY-MM-DD.log`。大写字母、下划线和字面连字符会采用一种可逆的连字符转义,确保不同的 profile 名称永远不会共用同一个日志文件。通过环境变量直接设置的超长取值会附加一个有界哈希后缀,以满足文件系统对文件名长度的限制。显式设置 `logging.file` 可覆盖以上默认行为。

日期使用 gateway 宿主机的本地时区。当 `/tmp/openclaw` 不安全或不可用时(Windows 上始终如此),OpenClaw 会改用操作系统临时目录下按用户隔离的 `openclaw-<uid>` 目录。带日期的日志文件会在 24 小时后被清理。

当下一次写入会超出 `logging.maxFileBytes`(默认 100 MB)时,文件就会轮转。OpenClaw 会在当前活动文件旁保留最多五个带编号的归档,例如 `openclaw-YYYY-MM-DD.1.log` 或 `openclaw-dev-YYYY-MM-DD.1.log`,并继续写入新的活动日志,而不是压制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖该路径:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何阅读日志

### CLI:实时跟踪(推荐)

通过 RPC 实时跟踪 gateway 日志文件:

```bash
openclaw logs --follow
openclaw --dev logs --follow
openclaw --profile work logs --follow
```

根级 profile 选择器会解析出 Gateway 实际使用的同一个 profile 专属文件,包括在本地 RPC 不可用时 CLI 的回退读取。

选项:

| 标志                | 默认值   | 行为                                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | 关闭     | 持续跟踪;断开后按退避策略重连                                                         |
| `--limit <n>`       | `200`    | 每次获取的最大行数                                                                    |
| `--max-bytes <n>`   | `250000` | 每次读取的最大字节数                                                                  |
| `--interval <ms>`   | `1000`   | 跟随模式下的轮询间隔                                                                  |
| `--json`            | 关闭     | 按行分隔的 JSON(每行一个事件)                                                       |
| `--plain`           | 关闭     | 在 TTY 会话中强制使用纯文本                                                           |
| `--no-color`        | —        | 禁用 ANSI 颜色                                                                        |
| `--utc`             | 关闭     | 以 UTC 渲染时间戳(默认为本地时间)                                                   |
| `--local-time`      | 关闭     | 本地时间默认值的兼容拼写;除此之外没有其他作用                                         |
| `--url` / `--token` | —        | 标准 Gateway RPC 标志                                                                 |
| `--timeout <ms>`    | `30000`  | Gateway RPC 超时时间                                                                  |
| `--expect-final`    | 关闭     | Agent 后端 RPC 的最终响应等待标志(此处经共享客户端层接受)                           |

输出模式:

- **TTY 会话**:美观、带颜色、结构化的日志行。
- **非 TTY 会话**:纯文本。

显式传入 `--url` 时,CLI 不会自动套用配置文件或环境变量中的凭据;你需要自行附带 `--token`,否则调用会以 `gateway url override requires explicit credentials` 报错。

在 JSON 模式下,CLI 会输出带 `type` 标签的对象:

- `meta`:流元数据(file、source、sourceKind、service、cursor、size)
- `log`:解析后的日志条目
- `notice`:截断/轮转提示
- `raw`:未解析的原始日志行
- `error`:gateway 连接失败(写入 stderr)

如果隐式的本地回环 Gateway 请求配对、在连接过程中关闭,或在 `logs.tail` 应答前超时,`openclaw logs` 会自动回退到所配置的 Gateway 文件日志。显式指定 `--url` 的目标不会使用这一回退。`openclaw logs --follow` 则更加严格:在 Linux 上,只要可用,它就会按 PID 读取活跃的 user-systemd Gateway journal;否则会以退避策略重试活跃的 Gateway,而不是去跟踪一个可能已经过期的旁路文件。

如果 Gateway 无法访问,CLI 会打印一条简短提示,让你运行:

```bash
openclaw doctor
```

### Control UI(网页)

Control UI 的 **Logs** 标签页同样通过 `logs.tail` 实时跟踪这个文件。
如何打开它参见 [Control UI](/web/control-ui)。

### 仅频道日志

要过滤某个频道的活动(WhatsApp/Telegram 等),使用:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` 默认为 `all`;此外还可用 `--lines <n>`(默认 200)和 `--json`。

## 日志格式

### 文件日志(JSONL)

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目,渲染出结构化输出(时间、级别、子系统、消息)。

在可用时,文件日志的 JSONL 记录还会包含便于机器过滤的顶层字段:

- `hostname`:gateway 主机名。
- `message`:扁平化的日志消息文本,用于全文检索。
- `agent_id`:当日志调用携带 agent 上下文时的活跃 agent id。
- `session_id`:当日志调用携带会话上下文时的活跃会话 id/键。
- `channel`:当日志调用携带频道上下文时的活跃频道。

OpenClaw 会在这些字段之外保留原有的结构化日志参数,因此读取 tslog 编号参数键的既有解析器仍然可以正常工作。

Talk、实时语音和托管房间(managed-room)活动会通过同一条文件日志管线输出有界的生命周期日志记录。这些记录在可用时包含事件类型、模式、传输方式、provider 以及大小/耗时度量,但会省略转写文本、音频载荷、turn id、通话 id 和 provider item id。

### 控制台输出

控制台日志**能感知 TTY**,并以便读为目标进行格式化:

- 子系统前缀(例如 `gateway/channels/whatsapp`)
- 级别着色(info/warn/error)
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 日志

`openclaw gateway` 还提供针对 RPC 流量的 WebSocket 协议日志:

- 普通模式:只记录值得关注的输出(错误、解析错误、慢调用)
- `--verbose`:所有请求/响应流量
- `--ws-log auto|compact|full`:选择 verbose 模式下的渲染风格
- `--compact`:`--ws-log compact` 的别名

示例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 配置日志

所有日志配置都位于 `~/.openclaw/openclaw.json` 的 `logging` 键下。

```json
{
  "logging": {
    "level": "info",
    "file": "/path/to/openclaw.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 日志级别

可用级别:`silent`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`。

- `logging.level`:**文件日志**(JSONL)级别(默认:`info`)。
- `logging.consoleLevel`:**控制台**详细程度级别。

两者都可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖(例如 `OPENCLAW_LOG_LEVEL=debug`)。环境变量优先于配置文件,因此无需修改 `openclaw.json` 就能为单次运行提高详细程度。你也可以传入全局 CLI 选项 **`--log-level <level>`**(例如 `openclaw --log-level debug gateway run`),它会在这条命令中覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志的详细程度,不会改变文件日志级别。

### 针对模型传输的定向诊断

调试 provider 调用时,请使用定向的环境变量开关,而不是把所有日志都提升到 `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用的开关:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`:以 `info` 级别输出请求开始、fetch 响应、SDK 请求头、首个流式事件、流完成以及传输错误。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`:在模型请求日志中附带一份有界的请求载荷摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`:在载荷摘要中包含所有面向模型的工具名称。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`:附带一份经过脱敏且限长的 JSON 载荷快照。仅调试时使用;密钥会被脱敏,但提示词和消息文本可能仍然出现。
- `OPENCLAW_DEBUG_SSE=events`:输出首个事件和流完成的耗时信息。
- `OPENCLAW_DEBUG_SSE=peek`:额外输出前五个脱敏后的 SSE 事件载荷,并按事件限长。
- `OPENCLAW_DEBUG_CODE_MODE=1`:输出 code mode 的模型表面诊断信息,包括有界的激活事实、最终可见表面,以及因 code mode 接管工具表面而被过滤掉的 provider 原生工具名称。

这些开关通过 OpenClaw 的常规日志机制输出,因此 `openclaw logs --follow` 和 Control UI 的 Logs 标签页都能看到它们。出于向后兼容考虑,`OPENCLAW_DEBUG_CODE_MODE` 还会把通用模型传输诊断提升到 `info` 级别;专属的 code mode 诊断仅在该开关启用时输出。

`[model-fetch]` 的开始与响应元数据(provider、API、模型、状态、延迟,以及方法、URL、超时、代理、策略等请求字段)始终以 `info` 级别输出,不受 `OPENCLAW_DEBUG_MODEL_TRANSPORT` 影响,因此不开调试开关也能看到基本的模型传输健康状况。

`[anthropic] replayed thinking dropped: N block(s)` 是一条警告,表示 Anthropic 报告在重放时丢弃了已失效的 thinking 内容。它包含不匹配的原因和最多五条受影响的消息路径,不包含 thinking 内容本身,无需任何调试开关。

`[anthropic] server-side context edit: cleared N tool results (M input tokens)` 是一条 info 级别日志,表示 Anthropic 报告执行了服务端的工具结果清理。它只包含计数,不含工具参数或结果内容,同样无需调试开关。启用清理的路由和阈值参见 [Session pruning](/concepts/session-pruning#direct-anthropic-api-key-requests)。

### 追踪关联(trace correlation)

文件日志是 JSONL 格式。当日志调用携带有效的诊断追踪上下文时,OpenClaw 会把追踪字段写成顶层 JSON 键(`traceId`、`spanId`、`parentSpanId`、`traceFlags`),以便外部日志处理系统能把这一行与 OTEL span 以及 provider 的 `traceparent` 传播关联起来。

Gateway 的 HTTP 请求和 Gateway WebSocket 帧会建立一个内部请求追踪作用域。在该异步作用域内输出的日志和诊断事件,如果没有显式传入追踪上下文,就会继承该请求的追踪。Agent 运行和模型调用的追踪会成为当前请求追踪的子级,因此本地日志、诊断快照、OTEL span 和可信 provider 的 `traceparent` 头可以凭借 `traceId` 关联起来,而不必记录原始请求或模型内容。

> 注:篇幅所限仅译核心章节,完整内容见原项目。
