"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  conversionEvents,
  customerContacts,
  customerNotes,
  customers,
  leadActivities,
  leadAttributions,
  leadStages,
  leads,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { parseLeadImportCsv } from "@/modules/leads/csv";
import {
  buildLeadActivityHistoryNote,
  buildLeadConversionSummaryNote,
} from "@/modules/leads/history";
import {
  closeWonLeadSchema,
  createLeadNoteSchema,
  createLeadSchema,
  importLeadRowSchema,
  markLeadLostSchema,
  moveLeadStageSchema,
  qualifyLeadSchema,
} from "@/modules/leads/validators";

export type LeadActionState = {
  error?: string;
  success?: string;
};

export type LeadImportActionState = LeadActionState & {
  created?: number;
  failed?: number;
  errors?: string[];
};

function parseTags(raw: string | undefined | null) {
  return (raw ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatCurrencyToCents(value: number) {
  return Math.round(value * 100);
}

async function assertStageBelongsToTenant(tenantId: string, stageId: string) {
  return db.query.leadStages.findFirst({
    where: and(eq(leadStages.id, stageId), eq(leadStages.tenantId, tenantId)),
  });
}

async function assertLeadBelongsToTenant(tenantId: string, leadId: string) {
  return db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)),
  });
}

export async function createLeadAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "create");
  const tenantContext = await getTenantContext();

  const parsed = createLeadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    stageId: formData.get("stageId"),
    estimatedValue: formData.get("estimatedValue"),
    tags: formData.get("tags"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const stage = await assertStageBelongsToTenant(tenantContext.tenantId, parsed.data.stageId);

  if (!stage) {
    return {
      error: "Estagio nao encontrado.",
    };
  }

  const leadId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(leads).values({
      id: leadId,
      tenantId: tenantContext.tenantId,
      stageId: parsed.data.stageId,
      assignedStaffMemberId: tenantContext.staffMemberId,
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: parsed.data.source,
      estimatedValueInCents: formatCurrencyToCents(parsed.data.estimatedValue),
      tags: parseTags(parsed.data.tags),
      description: parsed.data.description || null,
      lastActivityAt: new Date(),
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "created",
      body: `Lead criado em ${stage.name}`,
      metadata: {
        stageId: stage.id,
        stageName: stage.name,
      },
    });

    await tx.insert(leadAttributions).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId,
      entryPoint: "manual",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
      gclid: null,
      fbclid: null,
      fbp: null,
      fbc: null,
      ttclid: null,
      ctwaClid: null,
      referral: null,
      pageUrl: null,
      referrer: null,
      extraData: {},
    });
  });

  revalidatePath("/leads");

  return {
    success: "Lead criado com sucesso.",
  };
}

export async function moveLeadStageAction(input: {
  leadId: string;
  stageId: string;
}): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = moveLeadStageSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, nextStage] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertStageBelongsToTenant(tenantContext.tenantId, parsed.data.stageId),
  ]);

  if (!lead || !nextStage) {
    return {
      error: "Lead ou estagio nao encontrado.",
    };
  }

  if (lead.stageId === nextStage.id) {
    return {
      success: "Lead ja estava neste estagio.",
    };
  }

  const currentStage = await assertStageBelongsToTenant(tenantContext.tenantId, lead.stageId);

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        stageId: nextStage.id,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "stage_changed",
      body: `Lead movido de ${currentStage?.name ?? "Desconhecido"} para ${nextStage.name}`,
      metadata: {
        fromStageId: currentStage?.id ?? null,
        fromStageName: currentStage?.name ?? null,
        toStageId: nextStage.id,
        toStageName: nextStage.name,
      },
    });
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);

  return {
    success: "Estagio atualizado.",
  };
}

export async function createLeadNoteAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createLeadNoteSchema.safeParse({
    leadId,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const lead = await assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId);

  if (!lead) {
    return {
      error: "Lead nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: parsed.data.body,
      metadata: {},
    });

    await tx
      .update(leads)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");

  return {
    success: "Nota registrada.",
  };
}

export async function qualifyLeadAction(leadId: string): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = qualifyLeadSchema.safeParse({ leadId });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const lead = await assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId);

  if (!lead) {
    return {
      error: "Lead nao encontrado.",
    };
  }

  if (lead.qualification === "qualified") {
    return {
      success: "Lead ja esta qualificado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        qualification: "qualified",
        lostReason: null,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: "Lead marcado como qualificado.",
      metadata: {
        qualification: "qualified",
      },
    });
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");

  return {
    success: "Lead qualificado.",
  };
}

export async function markLeadLostAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = markLeadLostSchema.safeParse({
    leadId,
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const lead = await assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId);

  if (!lead) {
    return {
      error: "Lead nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        qualification: "lost",
        lostReason: parsed.data.reason,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Lead marcado como perdido. Motivo: ${parsed.data.reason}`,
      metadata: {
        qualification: "lost",
        reason: parsed.data.reason,
      },
    });
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");

  return {
    success: "Lead marcado como perdido.",
  };
}

export async function closeWonLeadAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = closeWonLeadSchema.safeParse({
    leadId,
    saleValue: formData.get("saleValue"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const lead = await assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId);

  if (!lead) {
    return {
      error: "Lead nao encontrado.",
    };
  }

  const saleValueInCents = formatCurrencyToCents(parsed.data.saleValue);
  const eventId = `won:${lead.id}:${Date.now()}`;

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        qualification: "won",
        saleValueInCents,
        saleCurrency: parsed.data.currency.toUpperCase(),
        lostReason: null,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Lead fechado como cliente. Valor: ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: parsed.data.currency.toUpperCase(),
      }).format(parsed.data.saleValue)}`,
      metadata: {
        qualification: "won",
        saleValueInCents,
        currency: parsed.data.currency.toUpperCase(),
      },
    });

    await tx.insert(conversionEvents).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      milestone: "won",
      valueInCents: saleValueInCents,
      currency: parsed.data.currency.toUpperCase(),
      eventId,
      eventTime: new Date(),
    });
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");

  return {
    success: "Lead fechado como ganho.",
  };
}

export async function convertLeadToCustomerAction(leadId: string): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  await assertPermission("customers", "create");
  const tenantContext = await getTenantContext();

  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantContext.tenantId)),
    with: {
      stage: true,
      attribution: true,
      activities: {
        with: {
          actor: true,
        },
        orderBy: (table, { asc }) => [asc(table.createdAt)],
      },
    },
  });

  if (!lead) {
    return {
      error: "Lead nao encontrado.",
    };
  }

  if (lead.convertedCustomerId) {
    return {
      success: "Lead ja foi convertido.",
    };
  }

  const customerId = createId();
  const attribution = lead.attribution[0] ?? null;
  const conversionSummaryNote = buildLeadConversionSummaryNote({
    leadId: lead.id,
    leadName: lead.name,
    company: lead.company,
    source: lead.source,
    stageName: lead.stage.name,
    estimatedValueInCents: lead.estimatedValueInCents,
    tags: lead.tags,
    attribution: attribution
      ? {
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmTerm: attribution.utmTerm,
          utmContent: attribution.utmContent,
          gclid: attribution.gclid,
          fbclid: attribution.fbclid,
          fbp: attribution.fbp,
          fbc: attribution.fbc,
          ttclid: attribution.ttclid,
          ctwaClid: attribution.ctwaClid,
          referral: attribution.referral,
          pageUrl: attribution.pageUrl,
          referrer: attribution.referrer,
        }
      : undefined,
  });

  await db.transaction(async (tx) => {
    await tx.insert(customers).values({
      id: customerId,
      tenantId: tenantContext.tenantId,
      legalName: lead.company || lead.name,
      tradeName: lead.company || lead.name,
      taxId: `LEAD-${lead.id.slice(-12)}`,
      city: "Nao informado",
      state: "NA",
      country: "BR",
      phone: lead.phone,
      website: null,
      currency: "BRL",
      tags: lead.tags,
      customData: {
        sourceLeadId: lead.id,
        sourceLeadStage: lead.stage.name,
        sourceLeadOrigin: lead.source,
      },
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(customerContacts).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      customerId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.phone,
      jobTitle: "Contato originado de lead",
      isPrimary: true,
      portalPermissions: [],
    });

    await tx.insert(customerNotes).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      customerId,
      authorStaffMemberId: tenantContext.staffMemberId,
      body: conversionSummaryNote,
    });

    if (lead.activities.length > 0) {
      await tx.insert(customerNotes).values(
        lead.activities.map((activity) => ({
          id: createId(),
          tenantId: tenantContext.tenantId,
          customerId,
          authorStaffMemberId: activity.actorStaffMemberId,
          body: buildLeadActivityHistoryNote({
            type: activity.type,
            actorName: activity.actor?.displayName,
            body: activity.body,
          }),
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt,
        })),
      );
    }

    await tx
      .update(leads)
      .set({
        convertedCustomerId: customerId,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "converted",
      body: "Lead convertido em cliente",
      metadata: {
        customerId,
      },
    });
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

  return {
    success: "Lead convertido em cliente.",
  };
}

export async function importLeadsCsvAction(
  _previousState: LeadImportActionState,
  formData: FormData,
): Promise<LeadImportActionState> {
  await assertPermission("leads", "create");
  const tenantContext = await getTenantContext();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Selecione um arquivo CSV valido.",
    };
  }

  let rows;

  try {
    const content = new TextDecoder("utf-8").decode(await file.arrayBuffer());
    rows = parseLeadImportCsv(content);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao ler o CSV.",
    };
  }

  const stages = await db.query.leadStages.findMany({
    where: eq(leadStages.tenantId, tenantContext.tenantId),
  });
  const stageMap = new Map(stages.map((stage) => [stage.name.toLowerCase(), stage]));
  const errors: string[] = [];

  const parsedRows = rows.map((row, index) => ({
    index,
    parsed: importLeadRowSchema.safeParse(row),
  }));

  const validRows = parsedRows.flatMap((row) => {
    if (!row.parsed.success) {
      errors.push(
        `Linha ${row.index + 2}: ${row.parsed.error.issues[0]?.message ?? "dados invalidos"}`,
      );
      return [];
    }

    const stage = stageMap.get(row.parsed.data.stageName.toLowerCase());

    if (!stage) {
      errors.push(`Linha ${row.index + 2}: estagio nao encontrado.`);
      return [];
    }

    return [{ ...row.parsed.data, stageId: stage.id }];
  });

  if (validRows.length > 0) {
    await db.transaction(async (tx) => {
      for (const row of validRows) {
        const leadId = createId();

        await tx.insert(leads).values({
          id: leadId,
          tenantId: tenantContext.tenantId,
          stageId: row.stageId,
          assignedStaffMemberId: tenantContext.staffMemberId,
          name: row.name,
          company: row.company || null,
          email: row.email,
          phone: row.phone,
          source: row.source,
          estimatedValueInCents: formatCurrencyToCents(row.estimatedValue),
          tags: parseTags(row.tags),
          description: row.description || null,
          lastActivityAt: new Date(),
          createdByStaffMemberId: tenantContext.staffMemberId,
        });

        await tx.insert(leadActivities).values({
          id: createId(),
          tenantId: tenantContext.tenantId,
          leadId,
          actorStaffMemberId: tenantContext.staffMemberId,
          type: "created",
          body: "Lead importado via CSV",
          metadata: {
            source: "csv",
          },
        });

        await tx.insert(leadAttributions).values({
          id: createId(),
          tenantId: tenantContext.tenantId,
          leadId,
          entryPoint: "csv_import",
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          utmTerm: null,
          utmContent: null,
          gclid: null,
          fbclid: null,
          fbp: null,
          fbc: null,
          ttclid: null,
          ctwaClid: null,
          referral: null,
          pageUrl: null,
          referrer: null,
          extraData: {
            source: "csv",
          },
        });
      }
    });
  }

  revalidatePath("/leads");

  return {
    success: validRows.length > 0 ? "Importacao concluida." : "Nenhum lead novo foi importado.",
    created: validRows.length,
    failed: errors.length,
    errors: errors.slice(0, 10),
  };
}
