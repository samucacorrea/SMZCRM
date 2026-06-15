import { logError, logInfo } from "@/lib/logger";

let registered = false;

export async function register() {
  if (registered) {
    return;
  }

  registered = true;

  logInfo("runtime.instrumentation.registered", {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });

  process.on("uncaughtException", (error) => {
    logError("runtime.uncaught_exception", error);
  });

  process.on("unhandledRejection", (reason) => {
    logError("runtime.unhandled_rejection", reason);
  });
}
