import { NextResponse } from "next/server";

import { executeWebhookPayload } from "@/modules/webhooks/inbound";
import { getInboundWebhookById, getInboundWebhookLogById } from "@/modules/webhooks/queries";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { createId } from "@/lib/ids";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> },
) {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const { id, logId } = await params;

  const [webhook, log] = await Promise.all([
    getInboundWebhookById(tenantContext.tenantId, id),
    getInboundWebhookLogById(tenantContext.tenantId, id, logId),
  ]);

  if (!webhook || !log) {
    return NextResponse.json({ error: "Webhook ou log nao encontrado." }, { status: 404 });
  }

  const result = await executeWebhookPayload({
    tenantId: tenantContext.tenantId,
    payload: log.rawPayload,
    eventId: `replay:${log.id}:${createId()}`,
    ipAddress: "internal-replay",
    webhook: {
      id: webhook.id,
      name: webhook.name,
      defaultStageId: webhook.defaultStageId,
      defaultSource: webhook.defaultSource,
      defaultOwnerId: webhook.defaultOwnerId,
      autoTags: webhook.autoTags,
      dedupKey: webhook.dedupKey,
      dedupAction: webhook.dedupAction,
      unmappedPolicy: webhook.unmappedPolicy,
      validation: webhook.validation,
      mappings: webhook.mappings.map((mapping) => ({
        sourceField: mapping.sourceField,
        targetType: mapping.targetType,
        targetKey: mapping.targetKey,
        transform: mapping.transform,
      })),
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason, result: result.result }, { status: 400 });
  }

  return NextResponse.json({
    leadId: result.leadId,
    result: result.result,
    duplicate: result.duplicate,
  });
}
