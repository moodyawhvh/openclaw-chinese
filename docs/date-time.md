> 🌐 本文档由 [openclaw/openclaw](https://github.com/openclaw/openclaw) 翻译,英文原版见原项目。

---
summary: "跨信封、提示词、工具与连接器的日期和时间处理"
read_when:
  - 你要修改展示给模型或用户的时间戳显示方式
  - 你在调试消息或 system prompt 输出中的时间格式
title: "日期与时间"
---

OpenClaw 在消息信封、系统事件和 system prompt 中使用配置的**用户时区**。当 `agents.defaults.userTimezone` 未设置时,这些界面会使用宿主机时区。服务提供方的原始时间戳会被保留,以便工具保持其原生语义。当 agent 需要精确的当前时间且 `session_status` 可用时,它会调用该工具。

## 消息信封(默认使用本地时区)

入站消息会包裹上带有星期几和秒级精度的时间戳:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

信封时间戳在已配置时使用 `agents.defaults.userTimezone`,否则使用宿主机时区。绝对时间戳和经过时间后缀都是内置的。

### 示例

**本地时区(默认):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**用户时区:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**经过时间:**

```
[WhatsApp +1555 +30s Sun 2026-01-18 00:20:12 CST] follow-up
```

## System prompt:时间上下文

system prompt 中包含一个易变的 **Temporal Context**(时间上下文)小节,带有本地日历日期和时区,但不包含实时时钟:

```
Current date: 2026-01-05
Time zone: America/Chicago
```

时区在已配置时使用 `agents.defaults.userTimezone`,否则使用宿主机时区。该小节位于 prompt 缓存边界之下,因此日期翻越和时区变更不会使稳定的前缀失效。在可用时,`session_status` 仍是获取精确当前时间的来源。

## 系统事件行(默认使用本地时区)

插入到 agent 上下文中的排队系统事件在已配置时使用 `agents.defaults.userTimezone`,否则使用宿主机时区。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 配置用户时区

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

- `userTimezone` 为消息信封、系统事件和 prompt 上下文设置用户所在时区。
- 请使用 IANA 时区名称,例如 `America/Chicago`、`Europe/Vienna` 或 `Asia/Tokyo`。

## 时间格式检测

渲染出的时钟值遵循操作系统与区域设置偏好。OpenClaw 会在 macOS 和 Windows 上检测 12 小时制或 24 小时制显示,否则回退到区域设置格式。检测到的值会按进程缓存。

## 工具载荷 + 连接器(原始服务方时间 + 规范化字段)

频道工具返回**服务提供方原生时间戳**,并附加规范化字段以保证一致性:

- `timestampMs`:epoch 毫秒(UTC)
- `timestampUtc`:ISO 8601 UTC 字符串

原始的服务提供方字段会被保留,不会丢失任何信息。

- Discord:UTC ISO 时间戳
- Slack:来自 API 的类 epoch 字符串
- Telegram/WhatsApp:服务提供方特定的数字/ISO 时间戳

如果你需要本地时间,请使用已知时区在下游进行转换。

## 相关文档

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)
