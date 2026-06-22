import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  projectActiveTimers,
  projectTimeEntries,
  projects,
  staffMembers,
  taskAssignees,
  tasks,
} from "@/lib/db/schema";

export async function listProjectsByTenant(
  tenantId: string,
  options?: { customerId?: string; status?: string },
) {
  return db.query.projects.findMany({
    where: and(
      eq(projects.tenantId, tenantId),
      options?.customerId ? eq(projects.customerId, options.customerId) : undefined,
      options?.status ? eq(projects.status, options.status as typeof projects.$inferSelect.status) : undefined,
    ),
    with: {
      customer: true,
      createdBy: true,
    },
    orderBy: [desc(projects.updatedAt), desc(projects.createdAt)],
  });
}

export async function getProjectById(tenantId: string, projectId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)),
    with: {
      customer: {
        with: {
          contacts: true,
        },
      },
      createdBy: true,
    },
  });
}

export async function listProjectOwnersByTenant(tenantId: string) {
  return db.query.staffMembers.findMany({
    where: eq(staffMembers.tenantId, tenantId),
    orderBy: [asc(staffMembers.displayName)],
  });
}

export async function listProjectTasksByProject(tenantId: string, projectId: string) {
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.tenantId, tenantId),
      eq(tasks.relatedType, "project"),
      eq(tasks.relatedId, projectId),
    ),
    with: {
      createdBy: true,
      assignees: {
        with: {
          staff: true,
        },
        orderBy: [asc(taskAssignees.createdAt)],
      },
    },
    orderBy: [asc(tasks.status), asc(tasks.dueDate), desc(tasks.createdAt)],
  });
}

export async function listProjectTimeEntriesByProject(tenantId: string, projectId: string) {
  return db.query.projectTimeEntries.findMany({
    where: and(
      eq(projectTimeEntries.tenantId, tenantId),
      eq(projectTimeEntries.projectId, projectId),
    ),
    with: {
      task: true,
      staff: true,
      invoice: true,
      createdBy: true,
    },
    orderBy: [desc(projectTimeEntries.workedAt), desc(projectTimeEntries.createdAt)],
  });
}

export async function listProjectTimeEntriesByTenant(
  tenantId: string,
  options?: {
    projectId?: string;
    staffId?: string;
    billable?: boolean;
  },
) {
  return db.query.projectTimeEntries.findMany({
    where: and(
      eq(projectTimeEntries.tenantId, tenantId),
      options?.projectId ? eq(projectTimeEntries.projectId, options.projectId) : undefined,
      options?.staffId ? eq(projectTimeEntries.staffId, options.staffId) : undefined,
      typeof options?.billable === "boolean"
        ? eq(projectTimeEntries.billable, options.billable)
        : undefined,
    ),
    with: {
      project: true,
      task: true,
      staff: true,
      invoice: true,
      createdBy: true,
    },
    orderBy: [desc(projectTimeEntries.workedAt), desc(projectTimeEntries.createdAt)],
  });
}

export async function listProjectActiveTimersByProject(tenantId: string, projectId: string) {
  return db.query.projectActiveTimers.findMany({
    where: and(
      eq(projectActiveTimers.tenantId, tenantId),
      eq(projectActiveTimers.projectId, projectId),
    ),
    with: {
      task: true,
      staff: true,
      createdBy: true,
    },
    orderBy: [asc(projectActiveTimers.startedAt)],
  });
}

export async function listProjectActiveTimersByTenant(
  tenantId: string,
  options?: {
    projectId?: string;
    staffId?: string;
  },
) {
  return db.query.projectActiveTimers.findMany({
    where: and(
      eq(projectActiveTimers.tenantId, tenantId),
      options?.projectId ? eq(projectActiveTimers.projectId, options.projectId) : undefined,
      options?.staffId ? eq(projectActiveTimers.staffId, options.staffId) : undefined,
    ),
    with: {
      project: true,
      task: true,
      staff: true,
      createdBy: true,
    },
    orderBy: [asc(projectActiveTimers.startedAt)],
  });
}

export async function listProjectTaskStatsByTenant(tenantId: string) {
  const tenantTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.tenantId, tenantId), eq(tasks.relatedType, "project")),
    columns: {
      relatedId: true,
      status: true,
    },
  });

  const stats = new Map<string, { total: number; open: number }>();

  for (const task of tenantTasks) {
    const current = stats.get(task.relatedId) ?? { total: 0, open: 0 };
    current.total += 1;
    if (task.status !== "done") {
      current.open += 1;
    }
    stats.set(task.relatedId, current);
  }

  return stats;
}

export async function listProjectTimeEntryStatsByTenant(tenantId: string) {
  const entries = await db.query.projectTimeEntries.findMany({
    where: eq(projectTimeEntries.tenantId, tenantId),
    columns: {
      projectId: true,
      durationMinutes: true,
      billable: true,
      amountInCents: true,
    },
  });

  const stats = new Map<
    string,
    {
      totalMinutes: number;
      billableMinutes: number;
      billableAmountInCents: number;
    }
  >();

  for (const entry of entries) {
    const current = stats.get(entry.projectId) ?? {
      totalMinutes: 0,
      billableMinutes: 0,
      billableAmountInCents: 0,
    };

    current.totalMinutes += entry.durationMinutes;

    if (entry.billable) {
      current.billableMinutes += entry.durationMinutes;
      current.billableAmountInCents += entry.amountInCents;
    }

    stats.set(entry.projectId, current);
  }

  return stats;
}
