"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { createTenantRepository } from "@/lib/db/repository";
import {
  customers,
  projectActiveTimers,
  projectTimeEntries,
  projects,
  staffMembers,
  taskAssignees,
  tasks,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import {
  createProjectSchema,
  createProjectTimeEntrySchema,
  createProjectTaskSchema,
  deleteProjectTimeEntrySchema,
  deleteProjectTaskSchema,
  deleteProjectSchema,
  startProjectTimerSchema,
  stopProjectTimerSchema,
  updateProjectTaskStatusSchema,
  updateProjectStatusSchema,
} from "@/modules/projects/validators";

export type ProjectActionState = {
  error?: string;
  success?: string;
};

function cents(value: number) {
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

async function assertTaskBelongsToProject(tenantId: string, projectId: string, taskId: string) {
  return db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, taskId),
      eq(tasks.tenantId, tenantId),
      eq(tasks.relatedType, "project"),
      eq(tasks.relatedId, projectId),
    ),
  });
}

async function assertTimeEntryBelongsToProject(
  tenantId: string,
  projectId: string,
  entryId: string,
) {
  return db.query.projectTimeEntries.findFirst({
    where: and(
      eq(projectTimeEntries.id, entryId),
      eq(projectTimeEntries.tenantId, tenantId),
      eq(projectTimeEntries.projectId, projectId),
    ),
  });
}

async function assertActiveTimerBelongsToProject(
  tenantId: string,
  projectId: string,
  timerId: string,
) {
  return db.query.projectActiveTimers.findFirst({
    where: and(
      eq(projectActiveTimers.id, timerId),
      eq(projectActiveTimers.tenantId, tenantId),
      eq(projectActiveTimers.projectId, projectId),
    ),
  });
}

export async function createProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  await assertPermission("crm", "create");
  const tenantContext = await getTenantContext();

  const parsed = createProjectSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    description: formData.get("description"),
    billingType: formData.get("billingType"),
    status: formData.get("status"),
    health: formData.get("health"),
    currency: formData.get("currency"),
    rate: formData.get("rate"),
    budget: formData.get("budget"),
    progress: formData.get("progress"),
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const customer = await assertCustomerBelongsToTenant(tenantContext.tenantId, parsed.data.customerId);

  if (!customer) {
    return { error: "Cliente nao encontrado." };
  }

  const repository = createTenantRepository(projects, tenantContext.tenantId);
  const projectId = createId();

  await db.insert(projects).values(
    repository.withTenant({
      id: projectId,
      customerId: customer.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      billingType: parsed.data.billingType,
      status: parsed.data.status,
      health: parsed.data.health,
      currency: parsed.data.currency.toUpperCase(),
      rateInCents: cents(parsed.data.rate),
      budgetInCents: cents(parsed.data.budget),
      progress: parsed.data.progress,
      startDate: parsed.data.startDate ?? null,
      dueDate: parsed.data.dueDate ?? null,
      portalVisibility: {
        enabled: false,
      },
      createdByStaffMemberId: tenantContext.staffMemberId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/customers/${customer.id}`);

  return { success: "Projeto criado." };
}

export async function updateProjectSnapshotAction(
  projectId: string,
  status: "planning" | "active" | "on_hold" | "completed" | "canceled",
  health: "healthy" | "attention" | "critical",
  progress: number,
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateProjectStatusSchema.safeParse({
    projectId,
    status,
    health,
    progress,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenantContext.tenantId)),
  });

  if (!project) {
    return { error: "Projeto nao encontrado." };
  }

  await db
    .update(projects)
    .set({
      status: parsed.data.status,
      health: parsed.data.health,
      progress: parsed.data.progress,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, project.id));

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Projeto atualizado." };
}

export async function deleteProjectAction(projectId: string): Promise<ProjectActionState> {
  await assertPermission("crm", "delete");
  const tenantContext = await getTenantContext();

  const parsed = deleteProjectSchema.safeParse({ projectId });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenantContext.tenantId)),
  });

  if (!project) {
    return { error: "Projeto nao encontrado." };
  }

  await db.delete(projects).where(eq(projects.id, project.id));

  revalidatePath("/projects");
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Projeto removido." };
}

export async function createProjectTaskAction(
  projectId: string,
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createProjectTaskSchema.safeParse({
    projectId,
    name: formData.get("name"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate") || undefined,
    assignedStaffMemberIds: formData
      .getAll("assignedStaffMemberIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const project = await assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId);

  if (!project) {
    return { error: "Projeto nao encontrado." };
  }

  const assignees = await db.query.staffMembers.findMany({
    where: and(
      eq(staffMembers.tenantId, tenantContext.tenantId),
      inArray(staffMembers.id, parsed.data.assignedStaffMemberIds),
    ),
  });

  if (assignees.length !== parsed.data.assignedStaffMemberIds.length) {
    return { error: "Um ou mais responsaveis sao invalidos." };
  }

  const taskId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(tasks).values({
      id: taskId,
      tenantId: tenantContext.tenantId,
      relatedType: "project",
      relatedId: project.id,
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
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Tarefa criada." };
}

export async function updateProjectTaskStatusAction(
  projectId: string,
  taskId: string,
  status: "todo" | "in_progress" | "done",
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateProjectTaskStatusSchema.safeParse({
    projectId,
    taskId,
    status,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const [project, task] = await Promise.all([
    assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId),
    assertTaskBelongsToProject(tenantContext.tenantId, parsed.data.projectId, parsed.data.taskId),
  ]);

  if (!project || !task) {
    return { error: "Projeto ou tarefa nao encontrado." };
  }

  await db
    .update(tasks)
    .set({
      status: parsed.data.status,
      completedAt: parsed.data.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Status da tarefa atualizado." };
}

export async function deleteProjectTaskAction(
  projectId: string,
  taskId: string,
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteProjectTaskSchema.safeParse({
    projectId,
    taskId,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const [project, task] = await Promise.all([
    assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId),
    assertTaskBelongsToProject(tenantContext.tenantId, parsed.data.projectId, parsed.data.taskId),
  ]);

  if (!project || !task) {
    return { error: "Projeto ou tarefa nao encontrado." };
  }

  await db.delete(tasks).where(eq(tasks.id, task.id));

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Tarefa removida." };
}

export async function createProjectTimeEntryAction(
  projectId: string,
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createProjectTimeEntrySchema.safeParse({
    projectId,
    taskId: formData.get("taskId"),
    staffId: formData.get("staffId"),
    workedAt: formData.get("workedAt"),
    durationMinutes: formData.get("durationMinutes"),
    billable: formData.get("billable") === "on",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const [project, task, staff] = await Promise.all([
    assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId),
    assertTaskBelongsToProject(tenantContext.tenantId, parsed.data.projectId, parsed.data.taskId),
    db.query.staffMembers.findFirst({
      where: and(
        eq(staffMembers.id, parsed.data.staffId),
        eq(staffMembers.tenantId, tenantContext.tenantId),
      ),
    }),
  ]);

  if (!project) {
    return { error: "Projeto nao encontrado." };
  }

  if (!task) {
    return { error: "Tarefa nao encontrada para este projeto." };
  }

  if (!staff) {
    return { error: "Responsavel invalido." };
  }

  const rateInCents = parsed.data.billable ? project.rateInCents : 0;
  const amountInCents = parsed.data.billable
    ? Math.round((parsed.data.durationMinutes / 60) * project.rateInCents)
    : 0;

  await db.insert(projectTimeEntries).values({
    id: createId(),
    tenantId: tenantContext.tenantId,
    projectId: project.id,
    taskId: task.id,
    staffId: staff.id,
    workedAt: parsed.data.workedAt,
    durationMinutes: parsed.data.durationMinutes,
    billable: parsed.data.billable,
    rateInCents,
    amountInCents,
    notes: parsed.data.notes || null,
    createdByStaffMemberId: tenantContext.staffMemberId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Hora registrada." };
}

export async function deleteProjectTimeEntryAction(
  projectId: string,
  entryId: string,
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = deleteProjectTimeEntrySchema.safeParse({
    projectId,
    entryId,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const [project, entry] = await Promise.all([
    assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId),
    assertTimeEntryBelongsToProject(
      tenantContext.tenantId,
      parsed.data.projectId,
      parsed.data.entryId,
    ),
  ]);

  if (!project || !entry) {
    return { error: "Projeto ou registro nao encontrado." };
  }

  await db.delete(projectTimeEntries).where(eq(projectTimeEntries.id, entry.id));

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Registro removido." };
}

export async function startProjectTimerAction(
  projectId: string,
  taskId: string,
  options?: {
    staffId?: string;
    billable?: boolean;
    notes?: string;
  },
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = startProjectTimerSchema.safeParse({
    projectId,
    taskId,
    staffId: options?.staffId ?? tenantContext.staffMemberId,
    billable: options?.billable ?? true,
    notes: options?.notes ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const [project, task, staff, existingTimer] = await Promise.all([
    assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId),
    assertTaskBelongsToProject(tenantContext.tenantId, parsed.data.projectId, parsed.data.taskId),
    db.query.staffMembers.findFirst({
      where: and(
        eq(staffMembers.id, parsed.data.staffId),
        eq(staffMembers.tenantId, tenantContext.tenantId),
      ),
    }),
    db.query.projectActiveTimers.findFirst({
      where: and(
        eq(projectActiveTimers.tenantId, tenantContext.tenantId),
        eq(projectActiveTimers.staffId, parsed.data.staffId),
      ),
    }),
  ]);

  if (!project) {
    return { error: "Projeto nao encontrado." };
  }

  if (!task) {
    return { error: "Tarefa nao encontrada para este projeto." };
  }

  if (!staff) {
    return { error: "Responsavel invalido." };
  }

  if (existingTimer) {
    return { error: "Este membro ja possui um timer ativo." };
  }

  await db.insert(projectActiveTimers).values({
    id: createId(),
    tenantId: tenantContext.tenantId,
    projectId: project.id,
    taskId: task.id,
    staffId: staff.id,
    startedAt: new Date(),
    billable: parsed.data.billable,
    notes: parsed.data.notes || null,
    createdByStaffMemberId: tenantContext.staffMemberId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Timer iniciado." };
}

export async function stopProjectTimerAction(
  projectId: string,
  timerId: string,
): Promise<ProjectActionState> {
  await assertPermission("crm", "edit");
  const tenantContext = await getTenantContext();

  const parsed = stopProjectTimerSchema.safeParse({
    projectId,
    timerId,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const [project, timer] = await Promise.all([
    assertProjectBelongsToTenant(tenantContext.tenantId, parsed.data.projectId),
    assertActiveTimerBelongsToProject(
      tenantContext.tenantId,
      parsed.data.projectId,
      parsed.data.timerId,
    ),
  ]);

  if (!project || !timer) {
    return { error: "Projeto ou timer nao encontrado." };
  }

  const elapsedMs = Date.now() - timer.startedAt.getTime();
  const durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  const rateInCents = timer.billable ? project.rateInCents : 0;
  const amountInCents = timer.billable
    ? Math.round((durationMinutes / 60) * project.rateInCents)
    : 0;

  await db.transaction(async (tx) => {
    await tx.insert(projectTimeEntries).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      projectId: project.id,
      taskId: timer.taskId,
      staffId: timer.staffId,
      workedAt: timer.startedAt,
      durationMinutes,
      billable: timer.billable,
      rateInCents,
      amountInCents,
      notes: timer.notes,
      createdByStaffMemberId: timer.createdByStaffMemberId ?? tenantContext.staffMemberId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.delete(projectActiveTimers).where(eq(projectActiveTimers.id, timer.id));
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/customers/${project.customerId}`);

  return { success: "Timer encerrado e hora registrada." };
}
