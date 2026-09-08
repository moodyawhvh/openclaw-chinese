#!/usr/bin/env node
// 在 Node 下启动 OpenClaw CLI 入口。
// OpenClaw 命令执行的 CLI 进程入口。
import process from "node:process";
import { fileURLToPath } from "node:url";
import { format } from "node:util";
import { isRootHelpInvocation } from "./cli/argv.js";
import { parseCliContainerArgs, resolveCliContainerTarget } from "./cli/container-target.js";
import { requestExitAfterOneShotOutput, runCliWithExitFinalization } from "./cli/one-shot-exit.js";
import {
  tryOutputPrecomputedCommandHelp,
  type PrecomputedCommandHelpDeps,
} from "./cli/precomputed-help.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./cli/profile.js";
import type { RootHelpRenderOptions } from "./cli/program/root-help.js";
import { isNativeHookRelayArgv } from "./cli/respawn-policy.js";
import { withCliProcessScope } from "./cli/runtime-cleanup-scope.js";
import {
  configureGatewayStartupTraceConsoleFormatting,
  createGatewayDispatchStartupTrace,
} from "./cli/startup-trace.js";
import { normalizeWindowsArgv } from "./cli/windows-argv.js";
import {
  enableOpenClawCompileCache,
  resolveEntryInstallRoot,
  respawnWithoutOpenClawCompileCacheIfNeeded,
} from "./entry.compile-cache.js";
import { installDistEsmResolveFastPath } from "./entry.esm-resolve-fast-path.js";
import { buildCliRespawnPlan, runCliRespawnPlan } from "./entry.respawn.js";
import { tryHandleRootVersionFastPath } from "./entry.version-fast-path.js";
import { normalizeEnv } from "./infra/env.js";
import { isMainModule } from "./infra/is-main.js";
import { ensureOpenClawExecMarkerOnProcess } from "./infra/openclaw-exec-env.js";
import { installProcessWarningFilter } from "./infra/warning-filter.js";
import { defaultRuntime } from "./runtime.js";

const ENTRY_WRAPPER_PAIRS = [
  { wrapperBasename: "openclaw.mjs", entryBasename: "entry.js" },
  { wrapperBasename: "openclaw.mjs", entryBasename: "entry.mjs" },
  { wrapperBasename: "openclaw.js", entryBasename: "entry.js" },
] as const;

const loadRootHelpLiveConfigModule = async () => await import("./cli/root-help-live-config.js");
const loadRootHelpMetadataModule = async () => await import("./cli/root-help-metadata.js");

async function writeCapturedCliArgumentError(message: string): Promise<void> {
  const { loadCliDotEnv } = await import("./cli/dotenv.js");
  loadCliDotEnv({ quiet: true });
  await configureGatewayStartupTraceConsoleFormatting(gatewayEntryStartupTrace);
  const { enableConsoleCapture } = await import("./logging.js");
  enableConsoleCapture();
  const [{ formatCliJsonFailure }, { isJsonOutputModeActive }] = await Promise.all([
    import("./cli/failure-output.js"),
    import("./cli/json-output-mode.js"),
  ]);
  if (isJsonOutputModeActive(process.argv)) {
    defaultRuntime.writeJson(formatCliJsonFailure(message));
  }
  console.error(`[openclaw] ${message}`);
}

async function prepareCliDiagnosticBlockWriter(): Promise<
  (message: string, error?: unknown) => void | Promise<void>
> {
  const loadWriter = async (): Promise<(message: string, error?: unknown) => void> => {
    const { loadCliDotEnv } = await import("./cli/dotenv.js");
    loadCliDotEnv({ quiet: true });
    await configureGatewayStartupTraceConsoleFormatting(gatewayEntryStartupTrace);
    const { formatConsoleDiagnosticBlock } = await import("./logging/json-console-line.js");
    return (message, error) => {
      const formatted = error === undefined ? message : format(message, error);
      process.stderr.write(
        formatConsoleDiagnosticBlock({
          level: "error",
          message: formatted.endsWith("\n") ? formatted : `${formatted}\n`,
        }),
      );
    };
  };
  // 显式 trace 会在 spawn 前刷新;未带 trace 且执行成功的父进程不需要诊断输出。
  return gatewayEntryStartupTrace.enabled
    ? loadWriter()
    : async (message, error) => (await loadWriter())(message, error);
}

async function flushEntryStartupTraceForEarlyReturn(argv: string[]): Promise<void> {
  if (!gatewayEntryStartupTrace.enabled) {
    return;
  }
  const { loadCliDotEnvForEarlyDiagnostic } = await import("./cli/dotenv.js");
  await loadCliDotEnvForEarlyDiagnostic(argv);
  await configureGatewayStartupTraceConsoleFormatting(gatewayEntryStartupTrace);
}

function shouldForceReadOnlyAuthStore(argv: string[]): boolean {
  const tokens = argv.slice(2).filter((token) => token.length > 0 && !token.startsWith("-"));
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index] === "secrets" && tokens[index + 1] === "audit") {
      return true;
    }
  }
  return false;
}

const gatewayEntryStartupTrace = createGatewayDispatchStartupTrace(process.argv, "entry");

// 守卫:仅当本文件作为主模块运行时才执行入口逻辑。
// 打包器可能在 dist/index.js 才是真正入口时,把 entry.js 作为共享依赖导入;
// 没有这个守卫,下面的顶层代码会第二次调用 runCli,启动一个重复的 gateway,
// 它会因锁/端口冲突而失败并导致进程崩溃。
if (
  !isMainModule({
    currentFile: fileURLToPath(import.meta.url),
    wrapperEntryPairs: [...ENTRY_WRAPPER_PAIRS],
  })
) {
  // 作为依赖被导入——跳过所有入口副作用。
} else {
  const entryFile = fileURLToPath(import.meta.url);
  const installRoot = resolveEntryInstallRoot(entryFile);
  installDistEsmResolveFastPath(import.meta.url);
  process.title = "openclaw";
  ensureOpenClawExecMarkerOnProcess();
  installProcessWarningFilter();
  normalizeEnv();
  process.argv = normalizeWindowsArgv(process.argv);
  const earlyProfile = parseCliProfileArgs(process.argv);
  if (earlyProfile.ok && earlyProfile.profile) {
    applyCliProfileEnv({ profile: earlyProfile.profile });
  }
  const { assertSupportedRuntime, isCurrentRuntimeSupported } =
    await import("./infra/runtime-guard.js");
  if (!isCurrentRuntimeSupported()) {
    const { loadCliDotEnv } = await import("./cli/dotenv.js");
    loadCliDotEnv({ quiet: true });
    await configureGatewayStartupTraceConsoleFormatting(gatewayEntryStartupTrace);
  }
  assertSupportedRuntime();
  gatewayEntryStartupTrace.mark("bootstrap");

  const waitingForCompileCacheRespawn = await respawnWithoutOpenClawCompileCacheIfNeeded({
    currentFile: entryFile,
    installRoot,
    prepareWriteError: async () => {
      // 子进程环境已快照。加载 dotenv 只为格式化父进程 trace;
      // 命令专属的 dotenv 加载顺序仍由子进程自己控制。
      const writeError = await prepareCliDiagnosticBlockWriter();
      return (message) => writeError(message);
    },
  });
  if (!waitingForCompileCacheRespawn) {
    enableOpenClawCompileCache({
      installRoot,
    });

    if (shouldForceReadOnlyAuthStore(process.argv)) {
      process.env.OPENCLAW_AUTH_STORE_READONLY = "1";
    }

    if (process.argv.includes("--no-color")) {
      process.env.NO_COLOR = "1";
      process.env.FORCE_COLOR = "0";
    }

    async function ensureCliRespawnReady(): Promise<boolean> {
      const plan = buildCliRespawnPlan();
      if (!plan) {
        return false;
      }

      // 子进程环境已快照。加载 dotenv 只为格式化父进程 trace;
      // 命令专属的 dotenv 加载顺序仍由子进程自己控制。
      const writeError = await prepareCliDiagnosticBlockWriter();
      runCliRespawnPlan(plan, undefined, writeError);
      // 父进程不得继续运行 CLI。
      return true;
    }

    if (!(await ensureCliRespawnReady())) {
      const parsedContainer = parseCliContainerArgs(process.argv);
      if (!parsedContainer.ok) {
        await writeCapturedCliArgumentError(parsedContainer.error);
        process.exit(2);
      }

      const parsed = parseCliProfileArgs(parsedContainer.argv);
      if (!parsed.ok) {
        // 保持简单;去掉标志后由 Commander 处理详细的帮助/错误信息。
        await writeCapturedCliArgumentError(parsed.error);
        process.exit(2);
      }

      const containerTargetName = resolveCliContainerTarget(process.argv);
      if (parsed.profile) {
        applyCliProfileEnv({ profile: parsed.profile });
        // 保持 Commander 与临时 argv 检查一致。
        process.argv = parsed.argv;
      }
      if (containerTargetName && parsed.profile) {
        await writeCapturedCliArgumentError("--container cannot be combined with --profile/--dev");
        process.exit(2);
      }
      gatewayEntryStartupTrace.mark("argv");

      if (!tryHandleRootVersionFastPath(process.argv)) {
        await withCliProcessScope(() => runMainOrRootHelp(process.argv));
      }
    }
  }
}

export async function tryHandleRootHelpFastPath(
  argv: string[],
  deps: {
    outputPrecomputedRootHelpText?: () => boolean;
    outputRootHelp?: (options?: RootHelpRenderOptions) => void | Promise<void>;
    loadRootHelpRenderOptionsForConfigSensitivePlugins?: (
      env?: NodeJS.ProcessEnv,
    ) => Promise<RootHelpRenderOptions | null>;
    onError?: (error: unknown) => void | Promise<void>;
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<boolean> {
  const env = deps.env ?? process.env;
  if (
    env.OPENCLAW_DISABLE_CLI_STARTUP_HELP_FAST_PATH === "1" ||
    resolveCliContainerTarget(argv, env)
  ) {
    return false;
  }
  if (!isRootHelpInvocation(argv)) {
    return false;
  }
  const handleError =
    deps.onError ??
    (async (error: unknown) => {
      const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
      const writeError = await prepareCliDiagnosticBlockWriter();
      await writeError(`[openclaw] Failed to display help: ${detail}\n`);
      process.exit(1);
    });
  try {
    const loadRootHelpRenderOptionsForConfigSensitivePlugins =
      deps.loadRootHelpRenderOptionsForConfigSensitivePlugins ??
      (await loadRootHelpLiveConfigModule()).loadRootHelpRenderOptionsForConfigSensitivePlugins;
    const liveRootHelpOptions = await loadRootHelpRenderOptionsForConfigSensitivePlugins(env);
    if (!liveRootHelpOptions) {
      const outputPrecomputedRootHelpText =
        deps.outputPrecomputedRootHelpText ??
        (await loadRootHelpMetadataModule()).outputPrecomputedRootHelpText;
      if (outputPrecomputedRootHelpText()) {
        return true;
      }
    }
    const outputRootHelp =
      deps.outputRootHelp ?? (await import("./cli/program/root-help.js")).outputRootHelp;
    await outputRootHelp(liveRootHelpOptions ?? undefined);
    return true;
  } catch (error) {
    await handleError(error);
    return true;
  }
}

export async function tryHandlePrecomputedCommandHelpFastPath(
  argv: string[],
  deps: PrecomputedCommandHelpDeps = {},
): Promise<boolean> {
  const env = deps.env ?? process.env;
  if (resolveCliContainerTarget(argv, env)) {
    return false;
  }

  try {
    return await tryOutputPrecomputedCommandHelp(argv, { ...deps, env });
  } catch {
    return false;
  }
}

export async function runMainOrRootHelp(
  argv: string[],
  deps: RunMainOrRootHelpDeps = {},
): Promise<void> {
  // 命令阶段的错误也会进入这个处理器:JSON 模式下 runCommandWithRuntime 会重新抛出,
  // 以便错误信封在这里写入。只有 runCli 之前的失败才算启动失败。
  let commandStarted = false;
  await runCliWithExitFinalization({
    run: async () => {
      if (isNativeHookRelayArgv(argv) && !argv.includes("--help") && !argv.includes("-h")) {
        const { runNativeHookRelayCliFromArgv } = await import("./cli/native-hook-relay-cli.js");
        const exitCode = await runNativeHookRelayCliFromArgv(argv);
        process.exitCode = exitCode;
        requestExitAfterOneShotOutput(defaultRuntime, exitCode);
        return;
      }
      if (await tryHandleRootHelpFastPath(argv)) {
        await flushEntryStartupTraceForEarlyReturn(argv);
        return;
      }
      if (await tryHandlePrecomputedCommandHelpFastPath(argv)) {
        await flushEntryStartupTraceForEarlyReturn(argv);
        return;
      }
      const { runCli } = await gatewayEntryStartupTrace.measure(
        "run-main-import",
        deps.loadRunCli ?? (() => import("./cli/run-main.js")),
      );
      commandStarted = true;
      await runCli(argv, {
        additionalStartupTrace: gatewayEntryStartupTrace,
        // runCli 结束后,终结器和进程退出钩子仍可能输出诊断信息。
        retainConsoleRoutingUntilProcessExit: true,
      });
    },
    onError: async (error) => {
      const { loadCliDotEnvForEarlyDiagnostic } = await import("./cli/dotenv.js");
      await loadCliDotEnvForEarlyDiagnostic(argv);
      await configureGatewayStartupTraceConsoleFormatting(gatewayEntryStartupTrace);
      const { enableConsoleCapture } = await import("./logging.js");
      enableConsoleCapture();
      const [{ formatCliFailureLines, formatCliJsonFailure }, { isJsonOutputModeActive }] =
        await Promise.all([import("./cli/failure-output.js"), import("./cli/json-output-mode.js")]);
      if (isJsonOutputModeActive(argv)) {
        defaultRuntime.writeJson(formatCliJsonFailure(error));
      }
      for (const line of formatCliFailureLines({
        title: commandStarted ? "The CLI command failed." : "Could not start the CLI.",
        error,
        argv,
      })) {
        console.error(line);
      }
      process.exitCode = 1;
    },
  });
}

type RunMainOrRootHelpDeps = {
  loadRunCli?: () => Promise<Pick<typeof import("./cli/run-main.js"), "runCli">>;
};
