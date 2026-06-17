import { NextResponse, type NextRequest } from "next/server";

import { verifySecret } from "@/lib/crypto";
import { withTenantContext } from "@/lib/db/tenant";
import { env } from "@/lib/env";
import { logError, logInfo } from "@/lib/logger";
import { assertRateLimit } from "@/lib/rate-limit";
import { executeWebhookPayload, resolveWebhookTarget } from "@/modules/webhooks/inbound";

function getWebhookToken(
  request: NextRequest,
  payload?: Record<string, unknown>,
) {
  const bearer = request.headers.get("authorization");

  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }

  return (
    request.headers.get("x-webhook-token") ??
    request.nextUrl.searchParams.get("token") ??
    (typeof payload?.token === "string" ? payload.token : "") ??
    ""
  ).trim();
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

async function parsePayload(request: NextRequest, rawText: string) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return JSON.parse(rawText) as Record<string, unknown>;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawText)) as Record<string, unknown>;
  }

  throw new Error("Tipo de payload nao suportado. Use JSON ou form-urlencoded.");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; webhookId: string }> },
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const path = request.nextUrl.pathname;
  const startedAt = Date.now();

  logInfo("webhook.request.started", {
    requestId,
    method: request.method,
    path,
  });

  try {
    const { tenant, webhookId } = await params;
    const ipAddress = getClientIp(request);

    const rateLimit = await assertRateLimit({
      key: `inbound:${webhookId}:${ipAddress}`,
      limit: env.INBOUND_WEBHOOK_RATE_LIMIT,
      windowMs: env.INBOUND_WEBHOOK_RATE_WINDOW_MS,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Rate limit excedido.",
        },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        },
      );
    }

    const target = await resolveWebhookTarget(tenant, webhookId);

    if (!target || target.webhook.status !== "active") {
      return NextResponse.json({ error: "Webhook nao encontrado." }, { status: 404 });
    }

    const rawText = await request.text();

    if (Buffer.byteLength(rawText, "utf8") > env.INBOUND_WEBHOOK_MAX_BYTES) {
      return NextResponse.json({ error: "Payload excede o tamanho maximo." }, { status: 413 });
    }

    let payload: Record<string, unknown>;

    try {
      payload = await parsePayload(request, rawText);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Payload invalido.",
        },
        { status: 400 },
      );
    }

    const token = getWebhookToken(request, payload);

    if (!token || !verifySecret(token, target.webhook.secretHash)) {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 });
    }

    const eventId =
      request.headers.get("x-event-id") ??
      (typeof payload.event_id === "string" ? payload.event_id : null);

    const response = await withTenantContext({ tenantId: target.tenant.id }, async () => {
      return executeWebhookPayload({
        tenantId: target.tenant.id,
        payload,
        ipAddress,
        eventId,
        webhook: {
          id: target.webhook.id,
          name: target.webhook.name,
          defaultStageId: target.webhook.defaultStageId,
          defaultSource: target.webhook.defaultSource,
          defaultOwnerId: target.webhook.defaultOwnerId,
          autoTags: target.webhook.autoTags,
          dedupKey: target.webhook.dedupKey,
          dedupAction: target.webhook.dedupAction,
          unmappedPolicy: target.webhook.unmappedPolicy,
          validation: target.webhook.validation,
          mappings: target.webhook.mappings.map((mapping) => ({
            sourceField: mapping.sourceField,
            targetType: mapping.targetType,
            targetKey: mapping.targetKey,
            transform: mapping.transform,
          })),
        },
      });
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: response.reason,
        },
        { status: 400 },
      );
    }

    const jsonResponse = NextResponse.json({
      leadId: response.leadId,
      result: response.result,
    });

    jsonResponse.headers.set("x-request-id", requestId);

    logInfo("webhook.request.completed", {
      requestId,
      method: request.method,
      path,
      status: jsonResponse.status,
      durationMs: Date.now() - startedAt,
    });

    return jsonResponse;
  } catch (error) {
    logError("webhook.request.failed", error, {
      requestId,
      method: request.method,
      path,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        error: "internal_server_error",
        requestId,
      },
      { status: 500 },
    );
  }
}
