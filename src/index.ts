#!/usr/bin/env node
import { existsSync } from "node:fs";
// 为包执行场景转发导出 OpenClaw CLI 入口。
// 包可执行文件入口,转发到 CLI 引导逻辑。
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRootUrl = new URL("../", import.meta.url);
if (
  !existsSync(new URL("entry.ts", import.meta.url)) &&
  (existsSync(new URL(".openclaw-lifecycle-pending", packageRootUrl)) ||
    existsSync(new URL("dist/openclaw-install-guard", packageRootUrl)))
) {
  const { completePendingPackageLifecycle } = await import("./infra/package-lifecycle.js");
  try {
    await completePendingPackageLifecycle({ packageRoot: fileURLToPath(packageRootUrl) });
  } catch (error) {
    throw new Error(
      `OpenClaw package lifecycle is incomplete. Reinstall with package scripts enabled, then retry. ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

const [
  { formatCliFailureLines, formatCliJsonFailure, isExpectedCliError },
  { isJsonOutputModeActive },
  { runCliWithExitFinalization },
  { withCliProcessScope },
  { installDistEsmResolveFastPath },
  { tryHandleRootVersionFastPath },
  { formatUncaughtError },
  { runFatalErrorHooks },
  { isMainModule },
  { installUnhandledRejectionHandler, isBenignUncaughtExceptionError, isUncaughtExceptionHandled },
] = await Promise.all([
  import("./cli/failure-output.js"),
  import("./cli/json-output-mode.js"),
  import("./cli/one-shot-exit.js"),
  import("./cli/runtime-cleanup-scope.js"),
  import("./entry.esm-resolve-fast-path.js"),
  import("./entry.version-fast-path.js"),
  import("./infra/errors.js"),
  import("./infra/fatal-error-hooks.js"),
  import("./infra/is-main.js"),
  import("./infra/unhandled-rejections.js"),
]);

type LegacyCliDeps = {
  runCli: (
    argv: string[],
    options?: {
      retainConsoleRoutingUntilProcessExit?: boolean;
    },
  ) => Promise<void>;
};

type LibraryExports = typeof import("./library.js");

// 这些绑定仅为库使用者填充。CLI 入口保持精简路径,
// 作为主模块运行时不得读取它们。
export let applyTemplate: LibraryExports["applyTemplate"];
export let createDefaultDeps: LibraryExports["createDefaultDeps"];
export let deriveSessionKey: LibraryExports["deriveSessionKey"];
export let describePortOwner: LibraryExports["describePortOwner"];
export let ensureBinary: LibraryExports["ensureBinary"];
export let ensurePortAvailable: LibraryExports["ensurePortAvailable"];
export let getReplyFromConfig: LibraryExports["getReplyFromConfig"];
export let handlePortError: LibraryExports["handlePortError"];
export let loadConfig: LibraryExports["loadConfig"];
/** @deprecated 请改用基于 SQLite 的 session API。计划于 2026-10-12 之后移除。 */
export let loadSessionStore: LibraryExports["loadSessionStore"];
export let monitorWebChannel: LibraryExports["monitorWebChannel"];
export let normalizeE164: LibraryExports["normalizeE164"];
export let PortInUseError: LibraryExports["PortInUseError"];
export let promptYesNo: LibraryExports["promptYesNo"];
export let resolveSessionKey: LibraryExports["resolveSessionKey"];
export let resolveStorePath: LibraryExports["resolveStorePath"];
export let runCommandWithTimeout: LibraryExports["runCommandWithTimeout"];
export let runExec: LibraryExports["runExec"];
/** @deprecated 请改用基于 SQLite 的 session API。计划于 2026-10-12 之后移除。 */
export let saveSessionStore: LibraryExports["saveSessionStore"];
export let waitForever: LibraryExports["waitForever"];

async function loadLegacyCliDeps(): Promise<LegacyCliDeps> {
  const { runCli } = await import("./cli/run-main.js");
  return { runCli };
}

// 旧版可执行入口桥接,同时导出给自行管理进程生命周期的调用方。
export async function runLegacyCliEntry(
  argv: string[] = process.argv,
  deps?: LegacyCliDeps,
  options?: {
    retainConsoleRoutingUntilProcessExit?: boolean;
  },
): Promise<void> {
  const { runCli } = deps ?? (await loadLegacyCliDeps());
  await runCli(argv, options);
}

const isMain = isMainModule({
  currentFile: fileURLToPath(import.meta.url),
});
if (isMain) {
  installDistEsmResolveFastPath(import.meta.url);
}
const handledRootVersion = isMain && tryHandleRootVersionFastPath(process.argv);

if (!isMain) {
  ({
    applyTemplate,
    createDefaultDeps,
    deriveSessionKey,
    describePortOwner,
    ensureBinary,
    ensurePortAvailable,
    getReplyFromConfig,
    handlePortError,
    loadConfig,
    loadSessionStore,
    monitorWebChannel,
    normalizeE164,
    PortInUseError,
    promptYesNo,
    resolveSessionKey,
    resolveStorePath,
    runCommandWithTimeout,
    runExec,
    saveSessionStore,
    waitForever,
  } = await import("./library.js"));
}

if (isMain && !handledRootVersion) {
  const { defaultRuntime, restoreRuntimeTerminalState } = await import("./runtime.js");

  // 全局错误处理器,防止未处理的 rejection/异常导致静默崩溃。
  // 它们会记录错误并优雅退出,而不是无痕迹地崩溃。
  installUnhandledRejectionHandler();

  process.on("uncaughtException", (error) => {
    if (isUncaughtExceptionHandled(error)) {
      return;
    }
    if (isBenignUncaughtExceptionError(error)) {
      console.warn(
        "[openclaw] Non-fatal uncaught exception (continuing):",
        formatUncaughtError(error),
      );
      return;
    }
    if (isJsonOutputModeActive(process.argv)) {
      defaultRuntime.writeJson(formatCliJsonFailure(error));
    }
    for (const line of formatCliFailureLines({
      title: "OpenClaw hit an unexpected runtime error.",
      error,
      argv: process.argv,
    })) {
      console.error(line);
    }
    for (const message of runFatalErrorHooks({ reason: "uncaught_exception", error })) {
      console.error("[openclaw]", message);
    }
    restoreRuntimeTerminalState("uncaught exception", { resumeStdinIfPaused: false });
    process.exit(1);
  });

  void runCliWithExitFinalization({
    run: () =>
      withCliProcessScope(() =>
        runLegacyCliEntry(process.argv, undefined, {
          // runCli 结束后,终结器和进程退出钩子仍可能输出诊断信息。
          retainConsoleRoutingUntilProcessExit: true,
        }),
      ),
    onError: (err) => {
      if (isJsonOutputModeActive(process.argv)) {
        defaultRuntime.writeJson(formatCliJsonFailure(err));
      }
      for (const line of formatCliFailureLines({
        title: "The CLI command failed.",
        error: err,
        argv: process.argv,
      })) {
        console.error(line);
      }
      if (!isExpectedCliError(err)) {
        for (const message of runFatalErrorHooks({ reason: "legacy_cli_failure", error: err })) {
          console.error("[openclaw]", message);
        }
      }
      restoreRuntimeTerminalState("legacy cli failure", { resumeStdinIfPaused: false });
      process.exitCode = 1;
    },
  });
}
