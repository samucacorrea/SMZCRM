"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  conversionEvents,
  customerContacts,
  customerNotes,
  customers,
  leadActivities,
  leadAttachments,
  leadFollowUps,
  leadAttributions,
  leadStages,
  leads,
  proposalItems,
  proposals,
  reminders,
  taskAssignees,
  tasks,
  staffMembers,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { assertPermission } from "@/lib/rbac";
import { storage } from "@/lib/storage";
import { getTenantContext } from "@/lib/tenant-context";
import { parseLeadImportCsv } from "@/modules/leads/csv";
import {
  buildLeadActivityHistoryNote,
  buildLeadConversionSummaryNote,
} from "@/modules/leads/history";
import {
  bulkAssignLeadOwnerSchema,
  bulkDeleteLeadsSchema,
  bulkMoveLeadsStageSchema,
  bulkQualifyLeadsSchema,
  bulkUpdateLeadTagsSchema,
  closeWonLeadSchema,
  completeLeadReminderSchema,
  createLeadNoteSchema,
  createLeadFollowUpSchema,
  createLeadProposalSchema,
  createLeadReminderSchema,
  createLeadTaskSchema,
  createLeadSchema,
  deleteLeadAttachmentSchema,
  deleteLeadFollowUpSchema,
  deleteLeadProposalSchema,
  deleteLeadReminderSchema,
  deleteLeadTaskSchema,
  importLeadRowSchema,
  markLeadLostSchema,
  moveLeadStageSchema,
  qualifyLeadSchema,
  updateLeadDetailsSchema,
  updateLeadProposalStatusSchema,
  updateLeadTaskStatusSchema,
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

function uniqTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function formatCurrencyToCents(value: number) {
  return Math.round(value * 100);
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function inferAttachmentKind(contentType: string) {
  if (contentType.startsWith("image/")) {
    return "image" as const;
  }

  if (
    contentType === "application/pdf" ||
    contentType.includes("word") ||
    contentType.includes("sheet") ||
    contentType.includes("presentation") ||
    contentType.startsWith("text/")
  ) {
    return "document" as const;
  }

  return "file" as const;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 120);
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

async function assertReminderBelongsToLead(
  tenantId: string,
  leadId: string,
  reminderId: string,
) {
  return db.query.reminders.findFirst({
    where: and(
      eq(reminders.id, reminderId),
      eq(reminders.tenantId, tenantId),
      eq(reminders.relatedType, "lead"),
      eq(reminders.relatedId, leadId),
    ),
  });
}

async function assertTaskBelongsToLead(tenantId: string, leadId: string, taskId: string) {
  return db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, taskId),
      eq(tasks.tenantId, tenantId),
      eq(tasks.relatedType, "lead"),
      eq(tasks.relatedId, leadId),
    ),
    with: {
      assignees: {
        with: {
          staff: true,
        },
      },
    },
  });
}

async function assertAttachmentBelongsToLead(
  tenantId: string,
  leadId: string,
  attachmentId: string,
) {
  return db.query.leadAttachments.findFirst({
    where: and(
      eq(leadAttachments.id, attachmentId),
      eq(leadAttachments.tenantId, tenantId),
      eq(leadAttachments.leadId, leadId),
    ),
  });
}

async function assertFollowUpBelongsToLead(
  tenantId: string,
  leadId: string,
  followUpId: string,
) {
  return db.query.leadFollowUps.findFirst({
    where: and(
      eq(leadFollowUps.id, followUpId),
      eq(leadFollowUps.tenantId, tenantId),
      eq(leadFollowUps.leadId, leadId),
    ),
  });
}

async function assertProposalBelongsToLead(
  tenantId: string,
  leadId: string,
  proposalId: string,
) {
  return db.query.proposals.findFirst({
    where: and(
      eq(proposals.id, proposalId),
      eq(proposals.tenantId, tenantId),
      eq(proposals.leadId, leadId),
    ),
    with: {
      items: true,
    },
  });
}

async function getNextProposalNumber(tenantId: string) {
  const existing = await db.query.proposals.findMany({
    where: eq(proposals.tenantId, tenantId),
    columns: {
      number: true,
    },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    limit: 20,
  });

  const nextSequence =
    existing
      .map((proposal) => Number(proposal.number.replace(/\D/g, "")))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0] ?? 0;

  return `PRP-${String(nextSequence + 1).padStart(4, "0")}`;
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

export async function updateLeadDetailsAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateLeadDetailsSchema.safeParse({
    leadId,
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    estimatedValue: formData.get("estimatedValue"),
    tags: formData.get("tags"),
    description: formData.get("description"),
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

  const nextTags = uniqTags(parseTags(parsed.data.tags));

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: parsed.data.source,
        estimatedValueInCents: formatCurrencyToCents(parsed.data.estimatedValue),
        tags: nextTags,
        description: parsed.data.description || null,
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
      body: "Dados principais do lead atualizados.",
      metadata: {
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: parsed.data.source,
        estimatedValueInCents: formatCurrencyToCents(parsed.data.estimatedValue),
        tags: nextTags,
      },
    });
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");
  revalidatePath("/leads/kanban");

  return {
    success: "Lead atualizado.",
  };
}

export async function bulkDeleteLeadsAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "delete");
  const tenantContext = await getTenantContext();

  const parsed = bulkDeleteLeadsSchema.safeParse({
    leadIds: formData
      .getAll("leadIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const tenantLeads = await db.query.leads.findMany({
    where: and(
      eq(leads.tenantId, tenantContext.tenantId),
      inArray(leads.id, parsed.data.leadIds),
    ),
  });

  if (tenantLeads.length === 0) {
    return {
      error: "Nenhum lead valido foi encontrado para exclusao.",
    };
  }

  await db
    .delete(leads)
    .where(
      and(
        eq(leads.tenantId, tenantContext.tenantId),
        inArray(
          leads.id,
          tenantLeads.map((lead) => lead.id),
        ),
      ),
    );

  revalidatePath("/leads");
  revalidatePath("/leads/kanban");

  return {
    success: `${tenantLeads.length} lead(s) excluido(s) com sucesso.`,
  };
}

export async function bulkMoveLeadsStageAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = bulkMoveLeadsStageSchema.safeParse({
    leadIds: formData
      .getAll("leadIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    stageId: formData.get("stageId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [tenantLeads, nextStage] = await Promise.all([
    db.query.leads.findMany({
      where: and(
        eq(leads.tenantId, tenantContext.tenantId),
        inArray(leads.id, parsed.data.leadIds),
      ),
    }),
    assertStageBelongsToTenant(tenantContext.tenantId, parsed.data.stageId),
  ]);

  if (!nextStage) {
    return {
      error: "Estagio nao encontrado.",
    };
  }

  if (tenantLeads.length === 0) {
    return {
      error: "Nenhum lead valido foi encontrado para edicao.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        stageId: nextStage.id,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leads.tenantId, tenantContext.tenantId),
          inArray(
            leads.id,
            tenantLeads.map((lead) => lead.id),
          ),
        ),
      );

    await tx.insert(leadActivities).values(
      tenantLeads.map((lead) => ({
        id: createId(),
        tenantId: tenantContext.tenantId,
        leadId: lead.id,
        actorStaffMemberId: tenantContext.staffMemberId,
        type: "stage_changed" as const,
        body: `Lead movido em massa para ${nextStage.name}`,
        metadata: {
          bulk: true,
          toStageId: nextStage.id,
          toStageName: nextStage.name,
        },
      })),
    );
  });

  revalidatePath("/leads");
  revalidatePath("/leads/kanban");

  return {
    success: `${tenantLeads.length} lead(s) atualizado(s) para ${nextStage.name}.`,
  };
}

export async function bulkQualifyLeadsAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = bulkQualifyLeadsSchema.safeParse({
    leadIds: formData
      .getAll("leadIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    qualification: formData.get("qualification"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const tenantLeads = await db.query.leads.findMany({
    where: and(
      eq(leads.tenantId, tenantContext.tenantId),
      inArray(leads.id, parsed.data.leadIds),
    ),
  });

  if (tenantLeads.length === 0) {
    return {
      error: "Nenhum lead valido foi encontrado para edicao.",
    };
  }

  const qualification = parsed.data.qualification;
  const reason = qualification === "lost" ? parsed.data.reason.trim() : null;

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        qualification,
        lostReason: reason,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leads.tenantId, tenantContext.tenantId),
          inArray(
            leads.id,
            tenantLeads.map((lead) => lead.id),
          ),
        ),
      );

    await tx.insert(leadActivities).values(
      tenantLeads.map((lead) => ({
        id: createId(),
        tenantId: tenantContext.tenantId,
        leadId: lead.id,
        actorStaffMemberId: tenantContext.staffMemberId,
        type: "note" as const,
        body:
          qualification === "qualified"
            ? "Lead marcado como qualificado em massa."
            : `Lead marcado como perdido em massa. Motivo: ${reason}`,
        metadata: {
          bulk: true,
          qualification,
          reason,
        },
      })),
    );
  });

  revalidatePath("/leads");
  revalidatePath("/leads/kanban");

  return {
    success:
      qualification === "qualified"
        ? `${tenantLeads.length} lead(s) qualificado(s).`
        : `${tenantLeads.length} lead(s) marcado(s) como perdido(s).`,
  };
}

export async function bulkAssignLeadOwnerAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = bulkAssignLeadOwnerSchema.safeParse({
    leadIds: formData
      .getAll("leadIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    assignedStaffMemberId: formData.get("assignedStaffMemberId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [tenantLeads, owner] = await Promise.all([
    db.query.leads.findMany({
      where: and(
        eq(leads.tenantId, tenantContext.tenantId),
        inArray(leads.id, parsed.data.leadIds),
      ),
    }),
    parsed.data.assignedStaffMemberId
      ? db.query.staffMembers.findFirst({
          where: and(
            eq(staffMembers.tenantId, tenantContext.tenantId),
            eq(staffMembers.id, parsed.data.assignedStaffMemberId),
          ),
        })
      : Promise.resolve(null),
  ]);

  if (tenantLeads.length === 0) {
    return {
      error: "Nenhum lead valido foi encontrado para edicao.",
    };
  }

  if (parsed.data.assignedStaffMemberId && !owner) {
    return {
      error: "Responsavel nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        assignedStaffMemberId: owner?.id ?? null,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leads.tenantId, tenantContext.tenantId),
          inArray(
            leads.id,
            tenantLeads.map((lead) => lead.id),
          ),
        ),
      );

    await tx.insert(leadActivities).values(
      tenantLeads.map((lead) => ({
        id: createId(),
        tenantId: tenantContext.tenantId,
        leadId: lead.id,
        actorStaffMemberId: tenantContext.staffMemberId,
        type: "note" as const,
        body: owner
          ? `Responsavel alterado em massa para ${owner.displayName}.`
          : "Responsavel removido em massa.",
        metadata: {
          bulk: true,
          assignedStaffMemberId: owner?.id ?? null,
          assignedStaffMemberName: owner?.displayName ?? null,
        },
      })),
    );
  });

  revalidatePath("/leads");
  revalidatePath("/leads/kanban");

  return {
    success: owner
      ? `${tenantLeads.length} lead(s) atribuido(s) para ${owner.displayName}.`
      : `${tenantLeads.length} lead(s) sem responsavel.`,
  };
}

export async function bulkUpdateLeadTagsAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = bulkUpdateLeadTagsSchema.safeParse({
    leadIds: formData
      .getAll("leadIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const tenantLeads = await db.query.leads.findMany({
    where: and(
      eq(leads.tenantId, tenantContext.tenantId),
      inArray(leads.id, parsed.data.leadIds),
    ),
  });

  if (tenantLeads.length === 0) {
    return {
      error: "Nenhum lead valido foi encontrado para edicao.",
    };
  }

  const nextTags = uniqTags(parseTags(parsed.data.tags));

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        tags: nextTags,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leads.tenantId, tenantContext.tenantId),
          inArray(
            leads.id,
            tenantLeads.map((lead) => lead.id),
          ),
        ),
      );

    await tx.insert(leadActivities).values(
      tenantLeads.map((lead) => ({
        id: createId(),
        tenantId: tenantContext.tenantId,
        leadId: lead.id,
        actorStaffMemberId: tenantContext.staffMemberId,
        type: "note" as const,
        body: `Tags atualizadas em massa: ${nextTags.join(", ")}`,
        metadata: {
          bulk: true,
          tags: nextTags,
        },
      })),
    );
  });

  revalidatePath("/leads");
  revalidatePath("/leads/kanban");

  return {
    success: `${tenantLeads.length} lead(s) com tags atualizadas.`,
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

export async function createLeadReminderAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createLeadReminderSchema.safeParse({
    leadId,
    description: formData.get("description"),
    remindAt: formData.get("remindAt"),
    notifyCustomer: formData.get("notifyCustomer") === "on",
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
    await tx.insert(reminders).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      relatedType: "lead",
      relatedId: lead.id,
      description: parsed.data.description,
      remindAt: parsed.data.remindAt,
      status: "pending",
      recipients: [],
      channels: [],
      notifyCustomer: parsed.data.notifyCustomer,
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Lembrete agendado para ${new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(parsed.data.remindAt)}.`,
      metadata: {
        reminderDescription: parsed.data.description,
        remindAt: parsed.data.remindAt.toISOString(),
        notifyCustomer: parsed.data.notifyCustomer,
      },
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
    success: "Lembrete criado.",
  };
}

export async function completeLeadReminderAction(
  leadId: string,
  reminderId: string,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = completeLeadReminderSchema.safeParse({
    leadId,
    reminderId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, reminder] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertReminderBelongsToLead(
      tenantContext.tenantId,
      parsed.data.leadId,
      parsed.data.reminderId,
    ),
  ]);

  if (!lead || !reminder) {
    return {
      error: "Lead ou lembrete nao encontrado.",
    };
  }

  if (reminder.status === "completed") {
    return {
      success: "Lembrete ja concluido.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(reminders)
      .set({
        status: "completed",
        completedAt: new Date(),
        completedByStaffMemberId: tenantContext.staffMemberId,
        updatedAt: new Date(),
      })
      .where(eq(reminders.id, reminder.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Lembrete concluido: ${reminder.description}`,
      metadata: {
        reminderId: reminder.id,
        completedAt: new Date().toISOString(),
      },
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
    success: "Lembrete concluido.",
  };
}

export async function deleteLeadReminderAction(
  leadId: string,
  reminderId: string,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteLeadReminderSchema.safeParse({
    leadId,
    reminderId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, reminder] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertReminderBelongsToLead(
      tenantContext.tenantId,
      parsed.data.leadId,
      parsed.data.reminderId,
    ),
  ]);

  if (!lead || !reminder) {
    return {
      error: "Lead ou lembrete nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(reminders).where(eq(reminders.id, reminder.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Lembrete removido: ${reminder.description}`,
      metadata: {
        reminderId: reminder.id,
      },
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
    success: "Lembrete removido.",
  };
}

export async function createLeadTaskAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createLeadTaskSchema.safeParse({
    leadId,
    name: formData.get("name"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate") || undefined,
    assignedStaffMemberIds: formData
      .getAll("assignedStaffMemberIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
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

  const assignees = await db.query.staffMembers.findMany({
    where: and(
      eq(staffMembers.tenantId, tenantContext.tenantId),
      inArray(staffMembers.id, parsed.data.assignedStaffMemberIds),
    ),
  });

  if (assignees.length !== parsed.data.assignedStaffMemberIds.length) {
    return {
      error: "Um ou mais responsaveis sao invalidos.",
    };
  }

  const taskId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(tasks).values({
      id: taskId,
      tenantId: tenantContext.tenantId,
      relatedType: "lead",
      relatedId: lead.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      status: "todo",
      dueDate: parsed.data.dueDate ?? null,
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(taskAssignees).values(
      assignees.map((assignee) => ({
        tenantId: tenantContext.tenantId,
        taskId,
        staffId: assignee.id,
      })),
    );

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Tarefa criada: ${parsed.data.name}`,
      metadata: {
        taskId,
        priority: parsed.data.priority,
        assignedStaffMemberIds: assignees.map((assignee) => assignee.id),
      },
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
    success: "Tarefa criada.",
  };
}

export async function updateLeadTaskStatusAction(
  leadId: string,
  taskId: string,
  status: "todo" | "in_progress" | "done",
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateLeadTaskStatusSchema.safeParse({
    leadId,
    taskId,
    status,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, task] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertTaskBelongsToLead(tenantContext.tenantId, parsed.data.leadId, parsed.data.taskId),
  ]);

  if (!lead || !task) {
    return {
      error: "Lead ou tarefa nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({
        status: parsed.data.status,
        completedAt: parsed.data.status === "done" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body:
        parsed.data.status === "done"
          ? `Tarefa concluida: ${task.name}`
          : `Status da tarefa atualizado para ${parsed.data.status}: ${task.name}`,
      metadata: {
        taskId: task.id,
        taskStatus: parsed.data.status,
      },
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
    success: "Status da tarefa atualizado.",
  };
}

export async function deleteLeadTaskAction(
  leadId: string,
  taskId: string,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteLeadTaskSchema.safeParse({
    leadId,
    taskId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, task] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertTaskBelongsToLead(tenantContext.tenantId, parsed.data.leadId, parsed.data.taskId),
  ]);

  if (!lead || !task) {
    return {
      error: "Lead ou tarefa nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(tasks).where(eq(tasks.id, task.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Tarefa removida: ${task.name}`,
      metadata: {
        taskId: task.id,
      },
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
    success: "Tarefa removida.",
  };
}

export async function createLeadProposalAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  let rawItems: unknown[] = [];

  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return {
      error: "Itens da proposta invalidos.",
    };
  }

  const parsed = createLeadProposalSchema.safeParse({
    leadId,
    title: formData.get("title"),
    validUntil: formData.get("validUntil") || undefined,
    notes: formData.get("notes"),
    items: rawItems,
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

  const number = await getNextProposalNumber(tenantContext.tenantId);
  const publicToken = randomBytes(24).toString("base64url");
  const normalizedItems = parsed.data.items.map((item, index) => {
    const unitPriceInCents = formatCurrencyToCents(item.unitPrice);
    const totalInCents = unitPriceInCents * item.quantity;

    return {
      id: createId(),
      tenantId: tenantContext.tenantId,
      description: item.description,
      quantity: item.quantity,
      unitPriceInCents,
      totalInCents,
      sortOrder: index,
    };
  });
  const subtotalInCents = normalizedItems.reduce((sum, item) => sum + item.totalInCents, 0);
  const proposalId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(proposals).values({
      id: proposalId,
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      customerId: lead.convertedCustomerId,
      number,
      title: parsed.data.title,
      status: "draft",
      content: {
        notes: parsed.data.notes,
      },
      validUntil: parsed.data.validUntil ?? null,
      publicToken,
      subtotalInCents,
      totalInCents: subtotalInCents,
      currency: "BRL",
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(proposalItems).values(
      normalizedItems.map((item) => ({
        ...item,
        proposalId,
      })),
    );

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Proposta criada: ${number} - ${parsed.data.title}`,
      metadata: {
        proposalId,
        proposalNumber: number,
        totalInCents: subtotalInCents,
      },
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
    success: "Proposta criada.",
  };
}

export async function updateLeadProposalStatusAction(
  leadId: string,
  proposalId: string,
  status: "draft" | "sent" | "accepted" | "rejected" | "expired",
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateLeadProposalStatusSchema.safeParse({
    leadId,
    proposalId,
    status,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, proposal] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertProposalBelongsToLead(
      tenantContext.tenantId,
      parsed.data.leadId,
      parsed.data.proposalId,
    ),
  ]);

  if (!lead || !proposal) {
    return {
      error: "Lead ou proposta nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(proposals)
      .set({
        status: parsed.data.status,
        acceptedAt: parsed.data.status === "accepted" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposal.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Status da proposta ${proposal.number} atualizado para ${parsed.data.status}.`,
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.number,
        status: parsed.data.status,
      },
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
    success: "Status da proposta atualizado.",
  };
}

export async function deleteLeadProposalAction(
  leadId: string,
  proposalId: string,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteLeadProposalSchema.safeParse({
    leadId,
    proposalId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, proposal] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertProposalBelongsToLead(
      tenantContext.tenantId,
      parsed.data.leadId,
      parsed.data.proposalId,
    ),
  ]);

  if (!lead || !proposal) {
    return {
      error: "Lead ou proposta nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(proposals).where(eq(proposals.id, proposal.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Proposta removida: ${proposal.number} - ${proposal.title}`,
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.number,
      },
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
    success: "Proposta removida.",
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

export async function createLeadAttachmentAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const lead = await assertLeadBelongsToTenant(tenantContext.tenantId, leadId);

  if (!lead) {
    return {
      error: "Lead nao encontrado.",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      error: "Selecione um arquivo valido.",
    };
  }

  if (!file.name || file.size === 0) {
    return {
      error: "Arquivo vazio ou invalido.",
    };
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      error: "O arquivo excede o limite de 10 MB.",
    };
  }

  const attachmentId = createId();
  const sanitizedFileName = sanitizeFileName(file.name) || `arquivo-${attachmentId}`;
  const storageKey = `tenants/${tenantContext.tenantId}/leads/${lead.id}/attachments/${attachmentId}-${sanitizedFileName}`;
  const contentType = file.type || "application/octet-stream";
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  await storage.putObject({
    key: storageKey,
    body: fileBytes,
    contentType,
    contentLength: file.size,
  });

  await db.transaction(async (tx) => {
    await tx.insert(leadAttachments).values({
      id: attachmentId,
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      fileName: file.name,
      contentType,
      sizeInBytes: file.size,
      storageKey,
      kind: inferAttachmentKind(contentType),
      uploadedByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Anexo enviado: ${file.name}`,
      metadata: {
        attachmentId,
        fileName: file.name,
        sizeInBytes: file.size,
        contentType,
      },
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
    success: "Anexo enviado.",
  };
}

export async function deleteLeadAttachmentAction(
  leadId: string,
  attachmentId: string,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteLeadAttachmentSchema.safeParse({
    leadId,
    attachmentId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, attachment] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertAttachmentBelongsToLead(
      tenantContext.tenantId,
      parsed.data.leadId,
      parsed.data.attachmentId,
    ),
  ]);

  if (!lead || !attachment) {
    return {
      error: "Lead ou anexo nao encontrado.",
    };
  }

  await storage.deleteObject({
    key: attachment.storageKey,
  });

  await db.transaction(async (tx) => {
    await tx.delete(leadAttachments).where(eq(leadAttachments.id, attachment.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Anexo removido: ${attachment.fileName}`,
      metadata: {
        attachmentId: attachment.id,
        fileName: attachment.fileName,
      },
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
    success: "Anexo removido.",
  };
}

export async function createLeadFollowUpAction(
  leadId: string,
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createLeadFollowUpSchema.safeParse({
    leadId,
    channel: formData.get("channel"),
    outcome: formData.get("outcome"),
    happenedAt: formData.get("happenedAt"),
    summary: formData.get("summary"),
    nextAction: formData.get("nextAction"),
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

  const channelLabels: Record<(typeof parsed.data)["channel"], string> = {
    call: "Ligação",
    whatsapp: "WhatsApp",
    email: "E-mail",
    meeting: "Reunião",
    other: "Outro",
  };

  const outcomeLabels: Record<(typeof parsed.data)["outcome"], string> = {
    pending: "Pendente",
    answered: "Respondeu",
    no_answer: "Sem resposta",
    interested: "Interessado",
    not_interested: "Sem interesse",
    scheduled: "Agendado",
  };

  const followUpId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(leadFollowUps).values({
      id: followUpId,
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      channel: parsed.data.channel,
      outcome: parsed.data.outcome,
      happenedAt: parsed.data.happenedAt,
      summary: parsed.data.summary,
      nextAction: parsed.data.nextAction || null,
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Follow-up registrado via ${channelLabels[parsed.data.channel]}. Resultado: ${outcomeLabels[parsed.data.outcome]}.`,
      metadata: {
        followUpId,
        channel: parsed.data.channel,
        outcome: parsed.data.outcome,
        happenedAt: parsed.data.happenedAt.toISOString(),
        summary: parsed.data.summary,
        nextAction: parsed.data.nextAction || null,
      },
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
    success: "Follow-up registrado.",
  };
}

export async function deleteLeadFollowUpAction(
  leadId: string,
  followUpId: string,
): Promise<LeadActionState> {
  await assertPermission("leads", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteLeadFollowUpSchema.safeParse({
    leadId,
    followUpId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [lead, followUp] = await Promise.all([
    assertLeadBelongsToTenant(tenantContext.tenantId, parsed.data.leadId),
    assertFollowUpBelongsToLead(
      tenantContext.tenantId,
      parsed.data.leadId,
      parsed.data.followUpId,
    ),
  ]);

  if (!lead || !followUp) {
    return {
      error: "Lead ou follow-up nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(leadFollowUps).where(eq(leadFollowUps.id, followUp.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      leadId: lead.id,
      actorStaffMemberId: tenantContext.staffMemberId,
      type: "note",
      body: `Follow-up removido: ${followUp.summary}`,
      metadata: {
        followUpId: followUp.id,
        channel: followUp.channel,
        outcome: followUp.outcome,
      },
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
    success: "Follow-up removido.",
  };
}
