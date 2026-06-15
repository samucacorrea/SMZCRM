import { and, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  auditLogs,
  customerContacts,
  customers,
  inboundWebhooks,
  leadActivities,
  leadAttributions,
  leads,
  tenants,
  webhookFieldMappings,
  webhookRequestLogs,
  type webhookRequestResultEnum,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { flattenPayload, getValueAtPath, normalizePhoneToDigits, normalizeWebhookValue, type JsonRecord } from "@/modules/webhooks/payload";

type TransformConfig = {
  type?:
    | "phone_e164"
    | "lowercase"
    | "uppercase"
    | "titlecase"
    | "cpf_digits"
    | "cep_digits"
    | "date_iso"
    | "fixed"
    | "conditional";
  value?: string;
};

type LeadMappedFields = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  description?: string;
  tags?: string[];
  customData?: Record<string, unknown>;
};

type AttributionMappedFields = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  ttclid?: string;
  ctwaClid?: string;
  referral?: string;
  pageUrl?: string;
  referrer?: string;
};

function applyTransform(rawValue: string, transform: TransformConfig) {
  const digitsOnly = rawValue.replace(/\D/g, "");

  switch (transform.type) {
    case "phone_e164":
      return normalizePhoneToDigits(rawValue);
    case "lowercase":
      return rawValue.toLowerCase();
    case "uppercase":
      return rawValue.toUpperCase();
    case "titlecase":
      return rawValue
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
        .join(" ");
    case "cpf_digits":
      return digitsOnly.slice(0, 11);
    case "cep_digits":
      return digitsOnly.slice(0, 8);
    case "date_iso": {
      const date = new Date(rawValue);
      if (Number.isNaN(date.getTime())) {
        return rawValue;
      }
      return date.toISOString().slice(0, 10);
    }
    case "fixed":
      return transform.value ?? rawValue;
    case "conditional": {
      const [expected, whenTrue, whenFalse] = (transform.value ?? "").split("|");
      if (!expected || !whenTrue) {
        return rawValue;
      }
      return rawValue === expected ? whenTrue : whenFalse ?? rawValue;
    }
    default:
      return rawValue;
  }
}

function defaultLeadMapping(payload: JsonRecord): LeadMappedFields {
  return {
    name: normalizeWebhookValue(
      payload.name ?? payload.full_name ?? payload.nome ?? payload.contact_name,
    ),
    company: normalizeWebhookValue(payload.company ?? payload.empresa),
    email: normalizeWebhookValue(payload.email),
    phone: normalizePhoneToDigits(
      normalizeWebhookValue(payload.phone ?? payload.telefone ?? payload.whatsapp),
    ),
    source: normalizeWebhookValue(payload.source ?? payload.origem),
    description: normalizeWebhookValue(
      payload.description ?? payload.message ?? payload.observacoes,
    ),
    tags: [],
  };
}

function defaultAttributionMapping(payload: JsonRecord) {
  return {
    utmSource: normalizeWebhookValue(payload.utm_source),
    utmMedium: normalizeWebhookValue(payload.utm_medium),
    utmCampaign: normalizeWebhookValue(payload.utm_campaign),
    utmTerm: normalizeWebhookValue(payload.utm_term),
    utmContent: normalizeWebhookValue(payload.utm_content),
    gclid: normalizeWebhookValue(payload.gclid),
    fbclid: normalizeWebhookValue(payload.fbclid),
    fbp: normalizeWebhookValue(payload.fbp),
    fbc: normalizeWebhookValue(payload.fbc),
    ttclid: normalizeWebhookValue(payload.ttclid),
    ctwaClid: normalizeWebhookValue(payload.ctwa_clid),
    referral: normalizeWebhookValue(payload.referral),
    pageUrl: normalizeWebhookValue(payload.page_url ?? payload.page),
    referrer: normalizeWebhookValue(payload.referrer),
  } satisfies AttributionMappedFields;
}

function buildWebhookCustomerTaxId(leadId: string) {
  return `LEAD-${leadId.slice(-12)}`;
}

async function upsertLeadAttributionTx(
  tx: any,
  input: {
    tenantId: string;
    leadId: string;
    entryPoint: string;
    attributionFields: AttributionMappedFields;
    extraData: JsonRecord;
  },
) {
  const existingAttribution = await tx.query.leadAttributions.findFirst({
    where: and(
      eq(leadAttributions.tenantId, input.tenantId),
      eq(leadAttributions.leadId, input.leadId),
    ),
  });

  if (existingAttribution) {
    await tx
      .update(leadAttributions)
      .set({
        utmSource: input.attributionFields.utmSource || existingAttribution.utmSource,
        utmMedium: input.attributionFields.utmMedium || existingAttribution.utmMedium,
        utmCampaign: input.attributionFields.utmCampaign || existingAttribution.utmCampaign,
        utmTerm: input.attributionFields.utmTerm || existingAttribution.utmTerm,
        utmContent: input.attributionFields.utmContent || existingAttribution.utmContent,
        gclid: input.attributionFields.gclid || existingAttribution.gclid,
        fbclid: input.attributionFields.fbclid || existingAttribution.fbclid,
        fbp: input.attributionFields.fbp || existingAttribution.fbp,
        fbc: input.attributionFields.fbc || existingAttribution.fbc,
        ttclid: input.attributionFields.ttclid || existingAttribution.ttclid,
        ctwaClid: input.attributionFields.ctwaClid || existingAttribution.ctwaClid,
        referral: input.attributionFields.referral || existingAttribution.referral,
        pageUrl: input.attributionFields.pageUrl || existingAttribution.pageUrl,
        referrer: input.attributionFields.referrer || existingAttribution.referrer,
        extraData: {
          ...(existingAttribution.extraData ?? {}),
          ...input.extraData,
        },
        updatedAt: new Date(),
      })
      .where(eq(leadAttributions.id, existingAttribution.id));

    return;
  }

  await tx.insert(leadAttributions).values({
    id: createId(),
    tenantId: input.tenantId,
    leadId: input.leadId,
    entryPoint: input.entryPoint,
    utmSource: input.attributionFields.utmSource || null,
    utmMedium: input.attributionFields.utmMedium || null,
    utmCampaign: input.attributionFields.utmCampaign || null,
    utmTerm: input.attributionFields.utmTerm || null,
    utmContent: input.attributionFields.utmContent || null,
    gclid: input.attributionFields.gclid || null,
    fbclid: input.attributionFields.fbclid || null,
    fbp: input.attributionFields.fbp || null,
    fbc: input.attributionFields.fbc || null,
    ttclid: input.attributionFields.ttclid || null,
    ctwaClid: input.attributionFields.ctwaClid || null,
    referral: input.attributionFields.referral || null,
    pageUrl: input.attributionFields.pageUrl || null,
    referrer: input.attributionFields.referrer || null,
    extraData: input.extraData,
  });
}

async function syncCustomerFromLeadTx(
  tx: any,
  input: {
    tenantId: string;
    lead: {
      id: string;
      convertedCustomerId?: string | null;
      name: string;
      company?: string | null;
      email: string;
      phone?: string | null;
      tags: string[];
    };
    actorStaffMemberId?: string | null;
    convertedBody: string;
  },
) {
  const legalName = input.lead.company || input.lead.name;
  const resolvedEmail = input.lead.email;
  const resolvedPhone = input.lead.phone ?? null;

  if (input.lead.convertedCustomerId) {
    await tx
      .update(customers)
      .set({
        legalName,
        tradeName: legalName,
        phone: resolvedPhone,
        tags: input.lead.tags,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, input.lead.convertedCustomerId));

    const primaryContact = await tx.query.customerContacts.findFirst({
      where: and(
        eq(customerContacts.tenantId, input.tenantId),
        eq(customerContacts.customerId, input.lead.convertedCustomerId),
        eq(customerContacts.isPrimary, true),
      ),
    });

    if (primaryContact) {
      await tx
        .update(customerContacts)
        .set({
          name: input.lead.name,
          email: resolvedEmail,
          phone: resolvedPhone,
          whatsapp: resolvedPhone,
          updatedAt: new Date(),
        })
        .where(eq(customerContacts.id, primaryContact.id));
    }

    return input.lead.convertedCustomerId;
  }

  const existingContact =
    resolvedEmail && !resolvedEmail.endsWith("@invalid.local")
      ? await tx.query.customerContacts.findFirst({
          where: and(
            eq(customerContacts.tenantId, input.tenantId),
            eq(customerContacts.email, resolvedEmail),
          ),
        })
      : null;

  const customerId = existingContact?.customerId ?? createId();

  if (!existingContact) {
    await tx.insert(customers).values({
      id: customerId,
      tenantId: input.tenantId,
      legalName,
      tradeName: legalName,
      taxId: buildWebhookCustomerTaxId(input.lead.id),
      city: "Nao informado",
      state: "NA",
      country: "BR",
      phone: resolvedPhone,
      website: null,
      currency: "BRL",
      tags: input.lead.tags,
      createdByStaffMemberId: input.actorStaffMemberId ?? null,
    });

    await tx.insert(customerContacts).values({
      id: createId(),
      tenantId: input.tenantId,
      customerId,
      name: input.lead.name,
      email: resolvedEmail,
      phone: resolvedPhone,
      whatsapp: resolvedPhone,
      jobTitle: "Contato originado de webhook",
      isPrimary: true,
      portalPermissions: [],
    });
  }

  await tx
    .update(leads)
    .set({
      convertedCustomerId: customerId,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, input.lead.id));

  await tx.insert(leadActivities).values({
    id: createId(),
    tenantId: input.tenantId,
    leadId: input.lead.id,
    actorStaffMemberId: input.actorStaffMemberId ?? null,
    type: "converted",
    body: input.convertedBody,
    metadata: {
      customerId,
      source: "webhook",
    },
  });

  return customerId;
}

export type WebhookExecutionConfig = {
  id: string;
  name: string;
  defaultStageId?: string | null;
  defaultSource?: string | null;
  defaultOwnerId?: string | null;
  autoTags?: string[];
  dedupKey: "email" | "phone" | "none";
  dedupAction: "create" | "update" | "note";
  unmappedPolicy: "ignore" | "store" | "notify";
  validation?: Record<string, unknown>;
  mappings: Array<{
    sourceField: string;
    targetType: "lead_field" | "attribution_field" | "custom_field";
    targetKey: string;
    transform: Record<string, unknown>;
  }>;
};

export async function resolveWebhookTarget(tenantParam: string, webhookId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: or(eq(tenants.slug, tenantParam), eq(tenants.id, tenantParam)),
  });

  if (!tenant) {
    return null;
  }

  const webhook = await db.query.inboundWebhooks.findFirst({
    where: and(eq(inboundWebhooks.id, webhookId), eq(inboundWebhooks.tenantId, tenant.id)),
    with: {
      mappings: true,
    },
  });

  if (!webhook) {
    return null;
  }

  return { tenant, webhook };
}

export async function logWebhookRequest(input: {
  tenantId: string;
  webhookId: string;
  rawPayload: JsonRecord;
  result: (typeof webhookRequestResultEnum.enumValues)[number];
  reason?: string;
  leadId?: string | null;
  ipAddress?: string | null;
  eventId?: string | null;
}) {
  await db.insert(webhookRequestLogs).values({
    id: createId(),
    tenantId: input.tenantId,
    webhookId: input.webhookId,
    rawPayload: input.rawPayload,
    result: input.result,
    reason: input.reason ?? null,
    leadId: input.leadId ?? null,
    ipAddress: input.ipAddress ?? null,
    eventId: input.eventId ?? null,
  });
}

export async function executeWebhookPayload(input: {
  tenantId: string;
  payload: JsonRecord;
  webhook: WebhookExecutionConfig;
  ipAddress?: string | null;
  eventId?: string | null;
}) {
  if (input.eventId) {
    const existingLog = await db.query.webhookRequestLogs.findFirst({
      where: and(
        eq(webhookRequestLogs.webhookId, input.webhook.id),
        eq(webhookRequestLogs.tenantId, input.tenantId),
        eq(webhookRequestLogs.eventId, input.eventId),
      ),
    });

    if (existingLog) {
      return {
        ok: existingLog.result !== "rejected",
        leadId: existingLog.leadId ?? undefined,
        result: existingLog.result,
        reason: existingLog.reason ?? "Evento ja processado anteriormente.",
        duplicate: true as const,
      };
    }
  }

  const result = await upsertLeadFromWebhook({
    tenantId: input.tenantId,
    webhookId: input.webhook.id,
    webhookName: input.webhook.name,
    payload: input.payload,
    mappings: input.webhook.mappings,
    defaultStageId: input.webhook.defaultStageId,
    defaultSource: input.webhook.defaultSource,
    defaultOwnerId: input.webhook.defaultOwnerId,
    autoTags: input.webhook.autoTags,
    dedupKey: input.webhook.dedupKey,
    dedupAction: input.webhook.dedupAction,
    unmappedPolicy: input.webhook.unmappedPolicy,
    validation: input.webhook.validation,
  });

  await logWebhookRequest({
    tenantId: input.tenantId,
    webhookId: input.webhook.id,
    rawPayload: input.payload,
    result: result.result,
    reason: result.ok ? undefined : result.reason,
    leadId: result.ok ? result.leadId : null,
    ipAddress: input.ipAddress ?? null,
    eventId: input.eventId ?? null,
  });

  return {
    ...result,
    duplicate: false as const,
  };
}

export function mapPayloadToLeadFields(input: {
  payload: JsonRecord;
  unmappedPolicy: "ignore" | "store" | "notify";
  mappings: Array<{
    sourceField: string;
    targetType: "lead_field" | "attribution_field" | "custom_field";
    targetKey: string;
    transform: Record<string, unknown>;
  }>;
}) {
  const leadFields = defaultLeadMapping(input.payload);
  const attributionFields = defaultAttributionMapping(input.payload);
  const extraData: JsonRecord = {};
  const customData: JsonRecord = {};
  const flattened = flattenPayload(input.payload);

  for (const mapping of input.mappings) {
    const raw = getValueAtPath(input.payload, mapping.sourceField);
    const normalized = applyTransform(
      normalizeWebhookValue(raw),
      mapping.transform as TransformConfig,
    );

    if (!normalized) {
      continue;
    }

    if (mapping.targetType === "lead_field") {
      if (mapping.targetKey === "tags") {
        leadFields.tags = normalized.split(",").map((tag) => tag.trim()).filter(Boolean);
      } else if (mapping.targetKey === "phone") {
        leadFields.phone = normalizePhoneToDigits(normalized);
      } else {
        (leadFields as Record<string, unknown>)[mapping.targetKey] = normalized;
      }
      continue;
    }

    if (mapping.targetType === "attribution_field") {
      (attributionFields as Record<string, unknown>)[mapping.targetKey] = normalized;
      continue;
    }

    customData[mapping.targetKey] = normalized;
  }

  if (input.unmappedPolicy !== "ignore") {
    for (const [path, value] of Object.entries(flattened)) {
      if (input.mappings.some((mapping) => mapping.sourceField === path)) {
        continue;
      }

      extraData[path] = value;
    }
  }

  return {
    leadFields,
    attributionFields,
    customData,
    extraData,
    flattened,
  };
}

export async function upsertLeadFromWebhook(input: {
  tenantId: string;
  webhookId: string;
  webhookName: string;
  payload: JsonRecord;
  mappings: Array<{
    sourceField: string;
    targetType: "lead_field" | "attribution_field" | "custom_field";
    targetKey: string;
    transform: Record<string, unknown>;
  }>;
  defaultStageId?: string | null;
  defaultSource?: string | null;
  defaultOwnerId?: string | null;
  autoTags?: string[];
  dedupKey: "email" | "phone" | "none";
  dedupAction: "create" | "update" | "note";
  unmappedPolicy: "ignore" | "store" | "notify";
  validation?: Record<string, unknown>;
}) {
  const { leadFields, attributionFields, customData, extraData, flattened } = mapPayloadToLeadFields({
    payload: input.payload,
    unmappedPolicy: input.unmappedPolicy,
    mappings: input.mappings,
  });

  const email = leadFields.email?.trim() || "";
  const phone = leadFields.phone?.trim() || "";

  const requireEmailOrPhone = input.validation?.requireEmailOrPhone !== false;
  const createCustomerOnLeadCreate =
    input.validation?.createCustomerOnLeadCreate !== false;

  if (requireEmailOrPhone && !email && !phone) {
    return {
      ok: false as const,
      reason: "Payload invalido: informe e-mail ou telefone.",
      result: "rejected" as const,
    };
  }

  const existingLead =
    input.dedupKey === "email" && email
      ? await db.query.leads.findFirst({
          where: and(eq(leads.tenantId, input.tenantId), eq(leads.email, email)),
        })
      : input.dedupKey === "phone" && phone
        ? await db.query.leads.findFirst({
            where: and(eq(leads.tenantId, input.tenantId), eq(leads.phone, phone)),
          })
        : null;

  if (existingLead && input.dedupAction === "note") {
    await db.transaction(async (tx) => {
      await tx.insert(leadActivities).values({
        id: createId(),
        tenantId: input.tenantId,
        leadId: existingLead.id,
        type: "note",
        body: `Webhook ${input.webhookName}: lead identificado por deduplicacao.`,
        metadata: {
          source: "webhook",
          payload: flattened,
        },
      });

      await upsertLeadAttributionTx(tx, {
        tenantId: input.tenantId,
        leadId: existingLead.id,
        entryPoint: "webhook",
        attributionFields,
        extraData,
      });

      if (Object.keys(customData).length > 0) {
        await tx
          .update(leads)
          .set({
            customData: {
              ...(existingLead.customData ?? {}),
              ...customData,
            },
            updatedAt: new Date(),
          })
          .where(eq(leads.id, existingLead.id));
      }

      if (input.unmappedPolicy === "notify" && Object.keys(extraData).length > 0) {
        await tx.insert(auditLogs).values({
          id: createId(),
          tenantId: input.tenantId,
          actorStaffMemberId: null,
          event: "webhook.unmapped_fields_detected",
          resourceType: "lead",
          resourceId: existingLead.id,
          payload: {
            webhookId: input.webhookId,
            webhookName: input.webhookName,
            extraData,
          },
        });
      }
    });

    return {
      ok: true as const,
      leadId: existingLead.id,
      result: "note" as const,
    };
  }

  if (existingLead && input.dedupAction === "update") {
    const mergedTags = Array.from(
      new Set([...(existingLead.tags ?? []), ...(leadFields.tags ?? []), ...(input.autoTags ?? [])]),
    );
    const nextLead = {
      id: existingLead.id,
      convertedCustomerId: existingLead.convertedCustomerId,
      name: leadFields.name || existingLead.name,
      company: leadFields.company || existingLead.company,
      email: email || existingLead.email,
      phone: phone || existingLead.phone,
      source: leadFields.source || input.defaultSource || existingLead.source,
      description: leadFields.description || existingLead.description,
      tags: mergedTags,
      customData: {
        ...(existingLead.customData ?? {}),
        ...customData,
      },
    };

    await db.transaction(async (tx) => {
      await tx
        .update(leads)
        .set({
          name: nextLead.name,
          company: nextLead.company,
          email: nextLead.email,
          phone: nextLead.phone,
          source: nextLead.source,
          description: nextLead.description,
          tags: nextLead.tags,
          customData: nextLead.customData,
          updatedAt: new Date(),
          lastActivityAt: new Date(),
        })
        .where(eq(leads.id, existingLead.id));

      await tx.insert(leadActivities).values({
        id: createId(),
        tenantId: input.tenantId,
        leadId: existingLead.id,
        type: "note",
        body: `Webhook ${input.webhookName}: lead atualizado.`,
        metadata: {
          source: "webhook",
          payload: flattened,
        },
      });

      if (createCustomerOnLeadCreate) {
        await syncCustomerFromLeadTx(tx, {
          tenantId: input.tenantId,
          lead: {
            id: nextLead.id,
            convertedCustomerId: nextLead.convertedCustomerId,
            name: nextLead.name,
            company: nextLead.company,
            email: nextLead.email,
            phone: nextLead.phone,
            tags: nextLead.tags,
          },
          actorStaffMemberId: input.defaultOwnerId ?? null,
          convertedBody: "Lead convertido automaticamente em cliente via webhook",
        });
      }

      await upsertLeadAttributionTx(tx, {
        tenantId: input.tenantId,
        leadId: existingLead.id,
        entryPoint: "webhook",
        attributionFields,
        extraData,
      });
    });

    return {
      ok: true as const,
      leadId: existingLead.id,
      result: "updated" as const,
    };
  }

  if (!input.defaultStageId) {
    return {
      ok: false as const,
      reason: "Webhook sem estagio inicial configurado.",
      result: "rejected" as const,
    };
  }

  const leadId = createId();
  const resolvedStageId = input.defaultStageId;
  const resolvedName = leadFields.name || email || phone || `lead-${leadId.slice(-8)}`;
  const resolvedSource = leadFields.source || input.defaultSource || "Webhook";

  await db.transaction(async (tx) => {
    await tx.insert(leads).values({
      id: leadId,
      tenantId: input.tenantId,
      stageId: resolvedStageId,
      assignedStaffMemberId: input.defaultOwnerId ?? null,
      name: resolvedName,
      company: leadFields.company || null,
      email: email || `sem-email-${leadId.slice(-8)}@invalid.local`,
      phone: phone || null,
      source: resolvedSource,
      estimatedValueInCents: 0,
      tags: Array.from(new Set([...(leadFields.tags ?? []), ...(input.autoTags ?? [])])),
      customData,
      description: leadFields.description || null,
      lastActivityAt: new Date(),
      createdByStaffMemberId: input.defaultOwnerId ?? null,
    });

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: input.tenantId,
      leadId,
      actorStaffMemberId: input.defaultOwnerId ?? null,
      type: "created",
      body: `Lead criado via webhook ${input.webhookName}`,
      metadata: {
        source: "webhook",
        webhookId: input.webhookId,
      },
    });

    await upsertLeadAttributionTx(tx, {
      tenantId: input.tenantId,
      leadId,
      entryPoint: "webhook",
      attributionFields,
      extraData,
    });

    if (createCustomerOnLeadCreate) {
      await syncCustomerFromLeadTx(tx, {
        tenantId: input.tenantId,
        lead: {
          id: leadId,
          convertedCustomerId: null,
          name: resolvedName,
          company: leadFields.company || null,
          email: email || `sem-email-${leadId.slice(-8)}@invalid.local`,
          phone: phone || null,
          tags: Array.from(new Set([...(leadFields.tags ?? []), ...(input.autoTags ?? [])])),
        },
        actorStaffMemberId: input.defaultOwnerId ?? null,
        convertedBody: "Lead convertido automaticamente em cliente via webhook",
      });
    }

    if (input.unmappedPolicy === "notify" && Object.keys(extraData).length > 0) {
      await tx.insert(leadActivities).values({
        id: createId(),
        tenantId: input.tenantId,
        leadId,
        actorStaffMemberId: input.defaultOwnerId ?? null,
        type: "note",
        body: `Webhook ${input.webhookName}: campos nao mapeados detectados.`,
        metadata: {
          source: "webhook",
          extraData,
        },
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        tenantId: input.tenantId,
        actorStaffMemberId: null,
        event: "webhook.unmapped_fields_detected",
        resourceType: "lead",
        resourceId: leadId,
        payload: {
          webhookId: input.webhookId,
          webhookName: input.webhookName,
          extraData,
        },
      });
    }
  });

  return {
    ok: true as const,
    leadId,
    result: "created" as const,
  };
}
