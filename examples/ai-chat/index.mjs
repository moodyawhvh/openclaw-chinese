// 最小的 @openclaw/ai 使用示例:单个隔离运行时、内置 provider、
// 一次流式补全。只使用公开包接口——不依赖 OpenClaw 应用内部代码。
// 构建前置条件和运行命令见 README.md。
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const MODELS = {
  anthropic: {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    api: "anthropic-messages",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
    reasoning: true,
    input: ["text"],
    cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
    contextWindow: 200_000,
    maxTokens: 8192,
  },
  openai: {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    api: "openai-responses",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    reasoning: true,
    input: ["text"],
    cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 },
    contextWindow: 1_050_000,
    maxTokens: 128_000,
  },
  // 本地 Ollama 服务;无需 API key。
  ollama: {
    id: process.env.OLLAMA_MODEL || "llama3.2:latest",
    name: "Ollama",
    api: "openai-completions",
    provider: "ollama",
    baseUrl: "http://localhost:11434/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32_000,
    maxTokens: 4096,
  },
};

const args = process.argv.slice(2);
const providerFlag = args.indexOf("--provider");
const provider = providerFlag === -1 ? "anthropic" : args[providerFlag + 1];
const prompt =
  args.filter((_, i) => i !== providerFlag && i !== providerFlag + 1).join(" ") ||
  "Reply with one short sentence: what is @openclaw/ai?";

const model = MODELS[provider];
if (!model) {
  console.error(`Unknown provider "${provider}". Use one of: ${Object.keys(MODELS).join(", ")}`);
  process.exit(1);
}

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(
  model,
  { messages: [{ role: "user", content: prompt, timestamp: Date.now() }] },
  // Ollama 会忽略凭据,但 OpenAI 兼容传输层要求必须提供一个。
  provider === "ollama" ? { apiKey: "ollama" } : undefined,
);

for await (const event of stream) {
  if (event.type === "text_delta") {
    process.stdout.write(event.delta);
  }
}
const result = await stream.result();
process.stdout.write("\n");

if (result.stopReason === "error" || result.stopReason === "aborted") {
  console.error(`error: ${result.errorMessage ?? result.stopReason}`);
  process.exit(1);
}
const { input, output } = result.usage;
console.error(`[${model.id}] stop=${result.stopReason} tokens in=${input} out=${output}`);
