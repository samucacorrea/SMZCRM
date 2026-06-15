import { NextResponse } from "next/server";

import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { getInboundWebhookById } from "@/modules/webhooks/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await assertPermission("webhooks", "view");
  const tenantContext = await getTenantContext();
  const { id } = await params;
  const webhook = await getInboundWebhookById(tenantContext.tenantId, id);

  if (!webhook) {
    return NextResponse.json({ error: "Webhook nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    webhookId: webhook.id,
    logs: webhook.requestLogs.map((log) => ({
      id: log.id,
      result: log.result,
      reason: log.reason,
      leadId: log.leadId,
      ipAddress: log.ipAddress,
      eventId: log.eventId,
      rawPayload: log.rawPayload,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}
