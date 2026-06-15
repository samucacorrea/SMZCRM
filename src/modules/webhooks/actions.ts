"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customFields, inboundWebhooks, webhookFieldMappings } from "@/lib/db/schema";
import { hashSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { NotFoundError } from "@/lib/errors";
import { createId } from "@/lib/ids";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { executeWebhookPayload } from "@/modules/webhooks/inbound";
import { getInboundWebhookById, getInboundWebhookLogById } from "@/modules/webhooks/queries";
import {
  createInboundWebhookSchema,
  createWebhookCustomFieldSchema,
  createWebhookMappingSchema,
  testInboundWebhookPayloadSchema,
  updateInboundWebhookSchema,
} from "@/modules/webhooks/validators";

export type InboundWebhookActionState = {
  error?: string;
  success?: string;
  secret?: string;
  webhookUrl?: string;
  leadId?: string;
  result?: string;
};

export async function createInboundWebhookAction(
  _previousState: InboundWebhookActionState,
  formData: FormData,
): Promise<InboundWebhookActionState> {
  await assertPermission("webhooks", "create");
  const tenantContext = await getTenantContext();

  const parsed = createInboundWebhookSchema.safeParse({
    name: formData.get("name"),
    defaultStageId: formData.get("defaultStageId"),
    defaultSource: formData.get("defaultSource"),
    autoTags: formData.get("autoTags"),
    dedupKey: formData.get("dedupKey"),
    dedupAction: formData.get("dedupAction"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const webhookId = createId();
  const secret = randomBytes(24).toString("base64url");

  await db.transaction(async (tx) => {
    await tx.insert(inboundWebhooks).values({
      id: webhookId,
      tenantId: tenantContext.tenantId,
      name: parsed.data.name,
      secretHash: hashSecret(secret),
      defaultStageId: parsed.data.defaultStageId,
      defaultSource: parsed.data.defaultSource,
      autoTags: (parsed.data.autoTags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      dedupKey: parsed.data.dedupKey,
      dedupAction: parsed.data.dedupAction,
      status: "active",
      unmappedPolicy: "store",
      validation: {
        requireEmailOrPhone: true,
        createCustomerOnLeadCreate: true,
      },
    });

    await tx.insert(webhookFieldMappings).values([
      {
        id: createId(),
        tenantId: tenantContext.tenantId,
        webhookId,
        sourceField: "name",
        targetType: "lead_field",
        targetKey: "name",
        transform: {},
        sortOrder: 0,
      },
      {
        id: createId(),
        tenantId: tenantContext.tenantId,
        webhookId,
        sourceField: "email",
        targetType: "lead_field",
        targetKey: "email",
        transform: { type: "lowercase" },
        sortOrder: 1,
      },
      {
        id: createId(),
        tenantId: tenantContext.tenantId,
        webhookId,
        sourceField: "phone",
        targetType: "lead_field",
        targetKey: "phone",
        transform: { type: "phone_e164" },
        sortOrder: 2,
      },
      {
        id: createId(),
        tenantId: tenantContext.tenantId,
        webhookId,
        sourceField: "utm_source",
        targetType: "attribution_field",
        targetKey: "utmSource",
        transform: {},
        sortOrder: 3,
      },
      {
        id: createId(),
        tenantId: tenantContext.tenantId,
        webhookId,
        sourceField: "utm_campaign",
        targetType: "attribution_field",
        targetKey: "utmCampaign",
        transform: {},
        sortOrder: 4,
      },
    ]);
  });

  revalidatePath("/webhooks");

  return {
    success: "Webhook criado com sucesso.",
    secret,
    webhookUrl: `${env.NEXT_PUBLIC_APP_URL}/api/in/${tenantContext.tenantId}/${webhookId}`,
  };
}

export async function rotateInboundWebhookSecretAction(
  webhookId: string,
  _previousState: InboundWebhookActionState,
): Promise<InboundWebhookActionState> {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const webhook = await db.query.inboundWebhooks.findFirst({
    where: and(
      eq(inboundWebhooks.id, webhookId),
      eq(inboundWebhooks.tenantId, tenantContext.tenantId),
    ),
  });

  if (!webhook) {
    throw new NotFoundError();
  }

  const secret = randomBytes(24).toString("base64url");

  await db
    .update(inboundWebhooks)
    .set({
      secretHash: hashSecret(secret),
      updatedAt: new Date(),
    })
    .where(eq(inboundWebhooks.id, webhookId));

  revalidatePath(`/webhooks/${webhookId}`);

  return {
    success: "Token secreto rotacionado com sucesso.",
    secret,
    webhookUrl: `${env.NEXT_PUBLIC_APP_URL}/api/in/${tenantContext.tenantId}/${webhookId}`,
  };
}

export async function testInboundWebhookPayloadAction(
  webhookId: string,
  _previousState: InboundWebhookActionState,
  formData: FormData,
): Promise<InboundWebhookActionState> {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const webhook = await getInboundWebhookById(tenantContext.tenantId, webhookId);

  if (!webhook) {
    throw new NotFoundError();
  }

  const parsed = testInboundWebhookPayloadSchema.safeParse({
    payload: formData.get("payload"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Payload invalido.",
    };
  }

  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(parsed.data.payload) as Record<string, unknown>;
  } catch {
    return {
      error: "Payload precisa ser JSON valido.",
    };
  }

  const result = await executeWebhookPayload({
    tenantId: tenantContext.tenantId,
    payload,
    eventId: `manual-test:${createId()}`,
    ipAddress: "internal",
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

  revalidatePath(`/webhooks/${webhookId}`);

  if (!result.ok) {
    return {
      error: result.reason,
      result: result.result,
    };
  }

  return {
    success: "Payload processado com sucesso.",
    leadId: result.leadId,
    result: result.result,
  };
}

export async function replayInboundWebhookLogAction(webhookId: string, logId: string) {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const [webhook, log] = await Promise.all([
    getInboundWebhookById(tenantContext.tenantId, webhookId),
    getInboundWebhookLogById(tenantContext.tenantId, webhookId, logId),
  ]);

  if (!webhook || !log) {
    throw new NotFoundError();
  }

  await executeWebhookPayload({
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

  revalidatePath(`/webhooks/${webhookId}`);
}

export async function updateInboundWebhookAction(
  webhookId: string,
  _previousState: InboundWebhookActionState,
  formData: FormData,
): Promise<InboundWebhookActionState> {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const webhook = await db.query.inboundWebhooks.findFirst({
    where: and(
      eq(inboundWebhooks.id, webhookId),
      eq(inboundWebhooks.tenantId, tenantContext.tenantId),
    ),
  });

  if (!webhook) {
    throw new NotFoundError();
  }

  const parsed = updateInboundWebhookSchema.safeParse({
    name: formData.get("name"),
    defaultStageId: formData.get("defaultStageId"),
    defaultSource: formData.get("defaultSource"),
    defaultOwnerId: formData.get("defaultOwnerId"),
    autoTags: formData.get("autoTags"),
    dedupKey: formData.get("dedupKey"),
    dedupAction: formData.get("dedupAction"),
    unmappedPolicy: formData.get("unmappedPolicy"),
    status: formData.get("status"),
    requireEmailOrPhone: formData.get("requireEmailOrPhone"),
    createCustomerOnLeadCreate: formData.get("createCustomerOnLeadCreate"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  await db
    .update(inboundWebhooks)
    .set({
      name: parsed.data.name,
      defaultStageId: parsed.data.defaultStageId,
      defaultSource: parsed.data.defaultSource,
      defaultOwnerId: parsed.data.defaultOwnerId || null,
      autoTags: (parsed.data.autoTags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      dedupKey: parsed.data.dedupKey,
      dedupAction: parsed.data.dedupAction,
      unmappedPolicy: parsed.data.unmappedPolicy,
      status: parsed.data.status,
      validation: {
        requireEmailOrPhone: parsed.data.requireEmailOrPhone === "true",
        createCustomerOnLeadCreate: parsed.data.createCustomerOnLeadCreate === "true",
      },
      updatedAt: new Date(),
    })
    .where(eq(inboundWebhooks.id, webhookId));

  revalidatePath(`/webhooks/${webhookId}`);
  revalidatePath("/webhooks");

  return {
    success: "Configuracao atualizada com sucesso.",
  };
}

export async function createWebhookMappingAction(
  webhookId: string,
  _previousState: InboundWebhookActionState,
  formData: FormData,
): Promise<InboundWebhookActionState> {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const webhook = await getInboundWebhookById(tenantContext.tenantId, webhookId);

  if (!webhook) {
    throw new NotFoundError();
  }

  const parsed = createWebhookMappingSchema.safeParse({
    sourceField: formData.get("sourceField"),
    targetType: formData.get("targetType"),
    targetKey: formData.get("targetKey"),
    transformType: formData.get("transformType"),
    transformValue: formData.get("transformValue"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const transform =
    parsed.data.transformType === "none"
      ? {}
      : parsed.data.transformType === "fixed"
        ? { type: "fixed", value: parsed.data.transformValue ?? "" }
        : { type: parsed.data.transformType };

  const existingMapping = webhook.mappings.find(
    (mapping) =>
      mapping.sourceField === parsed.data.sourceField &&
      mapping.targetKey === parsed.data.targetKey,
  );

  if (existingMapping) {
    return {
      error: "Esse mapeamento ja existe para este webhook.",
    };
  }

  await db.insert(webhookFieldMappings).values({
    id: createId(),
    tenantId: tenantContext.tenantId,
    webhookId,
    sourceField: parsed.data.sourceField,
    targetType: parsed.data.targetType,
    targetKey: parsed.data.targetKey,
    transform,
    sortOrder: webhook.mappings.length,
  });

  revalidatePath(`/webhooks/${webhookId}`);

  return {
    success: "Mapeamento criado com sucesso.",
  };
}

export async function deleteWebhookMappingAction(webhookId: string, mappingId: string) {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();

  await db
    .delete(webhookFieldMappings)
    .where(
      and(
        eq(webhookFieldMappings.id, mappingId),
        eq(webhookFieldMappings.webhookId, webhookId),
        eq(webhookFieldMappings.tenantId, tenantContext.tenantId),
      ),
    );

  revalidatePath(`/webhooks/${webhookId}`);
}

export async function createWebhookCustomFieldAction(
  webhookId: string,
  _previousState: InboundWebhookActionState,
  formData: FormData,
): Promise<InboundWebhookActionState> {
  await assertPermission("webhooks", "edit");
  const tenantContext = await getTenantContext();
  const webhook = await getInboundWebhookById(tenantContext.tenantId, webhookId);

  if (!webhook) {
    throw new NotFoundError();
  }

  const parsed = createWebhookCustomFieldSchema.safeParse({
    label: formData.get("label"),
    key: formData.get("key"),
    dataType: formData.get("dataType"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const existingCustomField = await db.query.customFields.findFirst({
    where: and(
      eq(customFields.tenantId, tenantContext.tenantId),
      eq(customFields.entity, "lead"),
      eq(customFields.key, parsed.data.key),
    ),
  });

  if (existingCustomField) {
    return {
      error: "Ja existe um campo personalizado com esta chave.",
    };
  }

  await db.insert(customFields).values({
    id: createId(),
    tenantId: tenantContext.tenantId,
    entity: "lead",
    key: parsed.data.key,
    label: parsed.data.label,
    dataType: parsed.data.dataType,
    isRequired: false,
  });

  revalidatePath(`/webhooks/${webhookId}`);

  return {
    success: "Campo personalizado criado.",
  };
}
