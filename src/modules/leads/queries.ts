import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  leadActivities,
  leadAttachments,
  leadFollowUps,
  proposalItems,
  proposals,
  leadStages,
  leads,
  reminders,
  taskAssignees,
  tasks,
  staffMembers,
  webhookRequestLogs,
} from "@/lib/db/schema";

export async function listLeadStagesByTenant(tenantId: string) {
  return db.query.leadStages.findMany({
    where: eq(leadStages.tenantId, tenantId),
    orderBy: [asc(leadStages.position)],
  });
}

export async function listLeadsByTenant(
  tenantId: string,
  options?: { query?: string; stageId?: string },
) {
  return db.query.leads.findMany({
    where: and(
      eq(leads.tenantId, tenantId),
      options?.stageId ? eq(leads.stageId, options.stageId) : undefined,
      options?.query
        ? or(
            ilike(leads.name, `%${options.query}%`),
            ilike(leads.company, `%${options.query}%`),
            ilike(leads.email, `%${options.query}%`),
            ilike(leads.source, `%${options.query}%`),
          )
        : undefined,
    ),
    with: {
      stage: true,
      assignee: true,
    },
    orderBy: [desc(leads.lastActivityAt), desc(leads.createdAt)],
  });
}

export async function getLeadById(tenantId: string, leadId: string) {
  return db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)),
    with: {
      stage: true,
      assignee: true,
      convertedCustomer: true,
      attribution: true,
      webhookLogs: {
        orderBy: [desc(webhookRequestLogs.createdAt)],
        limit: 1,
      },
      activities: {
        with: {
          actor: true,
        },
        orderBy: [desc(leadActivities.createdAt)],
      },
      reminders: {
        with: {
          createdBy: true,
          completedBy: true,
        },
        orderBy: [asc(reminders.status), asc(reminders.remindAt)],
      },
      tasks: {
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
      },
      proposals: {
        with: {
          createdBy: true,
          items: {
            orderBy: [asc(proposalItems.sortOrder)],
          },
        },
        orderBy: [desc(proposals.createdAt)],
      },
      attachments: {
        with: {
          uploadedBy: true,
        },
        orderBy: [desc(leadAttachments.createdAt)],
      },
      followUps: {
        with: {
          createdBy: true,
        },
        orderBy: [desc(leadFollowUps.happenedAt), desc(leadFollowUps.createdAt)],
      },
    },
  });
}

export async function listLeadOwnersByTenant(tenantId: string) {
  return db.query.staffMembers.findMany({
    where: eq(staffMembers.tenantId, tenantId),
    orderBy: (fields, { asc }) => [asc(fields.displayName)],
  });
}
