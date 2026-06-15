type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function writeLog(level: LogLevel, event: string, payload: LogPayload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const message = JSON.stringify(entry);

  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.log(message);
}

export function logInfo(event: string, payload?: LogPayload) {
  writeLog("info", event, payload);
}

export function logWarn(event: string, payload?: LogPayload) {
  writeLog("warn", event, payload);
}

export function logError(event: string, error: unknown, payload: LogPayload = {}) {
  writeLog("error", event, {
    ...payload,
    error: stringifyError(error),
  });
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export async function withRouteLogging(
  request: Request,
  meta: {
    area: string;
    action: string;
  },
  handler: () => Promise<Response>,
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const url = new URL(request.url);

  logInfo("http.request.started", {
    requestId,
    area: meta.area,
    action: meta.action,
    method: request.method,
    path: url.pathname,
  });

  try {
    const response = await handler();
    response.headers.set("x-request-id", requestId);

    logInfo("http.request.completed", {
      requestId,
      area: meta.area,
      action: meta.action,
      method: request.method,
      path: url.pathname,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    return response;
  } catch (error) {
    logError("http.request.failed", error, {
      requestId,
      area: meta.area,
      action: meta.action,
      method: request.method,
      path: url.pathname,
      durationMs: Date.now() - startedAt,
    });

    return Response.json(
      {
        error: "internal_server_error",
        requestId,
      },
      {
        status: 500,
        headers: {
          "x-request-id": requestId,
        },
      },
    );
  }
}
