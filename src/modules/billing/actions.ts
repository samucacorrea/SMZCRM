"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { createTenantRepository } from "@/lib/db/repository";
import { customers, invoices, projectTimeEntries, projects } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import {
  createInvoiceSchema,
  createProjectHoursInvoiceSchema,
  deleteInvoiceSchema,
  updateInvoiceStatusSchema,
} from "@/modules/billing/validators";

export type InvoiceActionState = {
  error?: string;
  success?: string;
};

function formatAmountToCents(value: number) {
  return Math.round(value * 100);
}

async function assertCustomerBelongsToTenant(tenantId: string, customerId: string) {
  return db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
  });
}

async function assertProjectBelongsToTenant(tenantId: string, projectId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)),
  });
}

async function getNextInvoiceNumber(tenantId: string) {
  const existing = await db.query.invoices.findMany({
    where: eq(invoices.tenantId, tenantId),
    columns: {
      number: true,
    },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    limit: 20,
  });

  const nextSequence =
    existing
      .map((invoice) => Number(invoice.number.replace(/\D/g, "")))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0] ?? 0;

  return `FAT-${String(nextSequence + 1).padStart(4, "0")}`;
}

export async function createInvoiceAction(
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  await assertPermission("billing", "create");
  const tenantContext = await getTenantContext();

  const parsed = createInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    projectId: formData.get("projectId") || undefined,
    description: formData.get("description"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    externalReference: formData.get("externalReference"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const customer = await assertCustomerBelongsToTenant(tenantContext.tenantId, parsed.data.customerId);

  if (!customer) {
    return {
      error: "Cliente nao encontrado.",
    };
  }

  if (parsed.data.projectId) {
    const project = await assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId);

    if (!project || project.customerId !== customer.id) {
      return {
        error: "Projeto invalido para este cliente.",
      };
    }
  }

  const repository = createTenantRepository(invoices, tenantContext.tenantId);
  const invoiceNumber = await getNextInvoiceNumber(tenantContext.tenantId);

  await db.insert(invoices).values(
    repository.withTenant({
      id: createId(),
      customerId: customer.id,
      projectId: parsed.data.projectId ?? null,
      number: invoiceNumber,
      status: "draft",
      description: parsed.data.description,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      currency: parsed.data.currency.toUpperCase(),
      amountInCents: formatAmountToCents(parsed.data.amount),
      externalReference: parsed.data.externalReference || null,
      notes: parsed.data.notes || null,
      createdByStaffMemberId: tenantContext.staffMemberId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );

  revalidatePath("/billing");
  revalidatePath(`/customers/${customer.id}`);

  return {
    success: "Fatura criada.",
  };
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: "draft" | "issued" | "paid" | "overdue" | "canceled",
): Promise<InvoiceActionState> {
  await assertPermission("billing", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateInvoiceStatusSchema.safeParse({
    invoiceId,
    status,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, parsed.data.invoiceId), eq(invoices.tenantId, tenantContext.tenantId)),
  });

  if (!invoice) {
    return {
      error: "Fatura nao encontrada.",
    };
  }

  await db
    .update(invoices)
    .set({
      status: parsed.data.status,
      paidAt: parsed.data.status === "paid" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoice.id));

  revalidatePath("/billing");
  revalidatePath(`/customers/${invoice.customerId}`);

  return {
    success: "Status da fatura atualizado.",
  };
}

export async function deleteInvoiceAction(invoiceId: string): Promise<InvoiceActionState> {
  await assertPermission("billing", "delete");
  const tenantContext = await getTenantContext();

  const parsed = deleteInvoiceSchema.safeParse({ invoiceId });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, parsed.data.invoiceId), eq(invoices.tenantId, tenantContext.tenantId)),
  });

  if (!invoice) {
    return {
      error: "Fatura nao encontrada.",
    };
  }

  await db.delete(invoices).where(eq(invoices.id, invoice.id));

  revalidatePath("/billing");
  revalidatePath(`/customers/${invoice.customerId}`);

  return {
    success: "Fatura removida.",
  };
}

export async function createProjectHoursInvoiceAction(
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  await assertPermission("billing", "create");
  const tenantContext = await getTenantContext();

  const parsed = createProjectHoursInvoiceSchema.safeParse({
    projectId: formData.get("projectId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const project = await assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId);

  if (!project) {
    return {
      error: "Projeto nao encontrado.",
    };
  }

  const unbilledEntries = await db.query.projectTimeEntries.findMany({
    where: and(
      eq(projectTimeEntries.tenantId, tenantContext.tenantId),
      eq(projectTimeEntries.projectId, project.id),
      eq(projectTimeEntries.billable, true),
      isNull(projectTimeEntries.invoiceId),
    ),
    with: {
      task: true,
      staff: true,
    },
    orderBy: (fields, { asc }) => [asc(fields.workedAt)],
  });

  if (unbilledEntries.length === 0) {
    return {
      error: "Nao ha horas faturaveis pendentes para este projeto.",
    };
  }

  const amountInCents = unbilledEntries.reduce((total, entry) => total + entry.amountInCents, 0);
  const totalMinutes = unbilledEntries.reduce((total, entry) => total + entry.durationMinutes, 0);
  const invoiceNumber = await getNextInvoiceNumber(tenantContext.tenantId);
  const invoiceId = createId();

  const description = `Horas faturáveis do projeto ${project.name}`;
  const notes = [
    parsed.data.notes || null,
    `Total de horas: ${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, "0")}`,
    ...unbilledEntries.map((entry) => {
      const hours = Math.floor(entry.durationMinutes / 60);
      const minutes = entry.durationMinutes % 60;
      return `- ${entry.task?.name || "Tarefa"} · ${entry.staff.displayName} · ${hours}h${String(minutes).padStart(2, "0")}`;
    }),
  ]
    .filter(Boolean)
    .join("\n");

  await db.transaction(async (tx) => {
    await tx.insert(invoices).values({
      id: invoiceId,
      tenantId: tenantContext.tenantId,
      customerId: project.customerId,
      projectId: project.id,
      number: invoiceNumber,
      status: "draft",
      description,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      currency: project.currency,
      amountInCents,
      externalReference: null,
      notes,
      createdByStaffMemberId: tenantContext.staffMemberId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx
      .update(projectTimeEntries)
      .set({
        invoiceId,
        billedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectTimeEntries.tenantId, tenantContext.tenantId),
          eq(projectTimeEntries.projectId, project.id),
          eq(projectTimeEntries.billable, true),
          isNull(projectTimeEntries.invoiceId),
        ),
      );
  });

  revalidatePath("/billing");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return {
    success: "Fatura gerada a partir das horas pendentes.",
  };
}
