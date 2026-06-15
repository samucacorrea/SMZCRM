import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customFields, inboundWebhooks, staffMembers, webhookRequestLogs } from "@/lib/db/schema";

export async function listInboundWebhooksByTenant(tenantId: string) {
  return db.query.inboundWebhooks.findMany({
    where: eq(inboundWebhooks.tenantId, tenantId),
    with: {
      defaultStage: true,
      defaultOwner: true,
    },
    orderBy: [desc(inboundWebhooks.createdAt)],
  });
}

export async function getInboundWebhookById(tenantId: string, webhookId: string) {
  return db.query.inboundWebhooks.findFirst({
    where: and(eq(inboundWebhooks.id, webhookId), eq(inboundWebhooks.tenantId, tenantId)),
    with: {
      defaultStage: true,
      defaultOwner: true,
      mappings: {
        orderBy: (fields, { asc }) => [asc(fields.sortOrder), asc(fields.createdAt)],
      },
      requestLogs: {
        orderBy: [desc(webhookRequestLogs.createdAt)],
        limit: 20,
      },
    },
  });
}

export async function getInboundWebhookLogById(
  tenantId: string,
  webhookId: string,
  logId: string,
) {
  return db.query.webhookRequestLogs.findFirst({
    where: and(
      eq(webhookRequestLogs.id, logId),
      eq(webhookRequestLogs.webhookId, webhookId),
      eq(webhookRequestLogs.tenantId, tenantId),
    ),
  });
}

export async function listLeadCustomFieldsByTenant(tenantId: string) {
  return db.query.customFields.findMany({
    where: and(eq(customFields.tenantId, tenantId), eq(customFields.entity, "lead")),
    orderBy: (fields, { asc }) => [asc(fields.label)],
  });
}

export async function listStaffMembersByTenant(tenantId: string) {
  return db.query.staffMembers.findMany({
    where: eq(staffMembers.tenantId, tenantId),
    orderBy: (fields, { asc }) => [asc(fields.displayName)],
  });
}
