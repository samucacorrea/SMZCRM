import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leadStages } from "@/lib/db/schema";
import { createId } from "@/lib/ids";

const DEFAULT_LEAD_STAGES = [
  { name: "Entrada", color: "#2563EB" },
  { name: "Qualificação", color: "#0EA5E9" },
  { name: "Proposta", color: "#F97316" },
  { name: "Negociação", color: "#F59E0B" },
  { name: "Ganho", color: "#16A34A" },
  { name: "Perdido", color: "#6B7280" },
] as const;

export async function syncTenantLeadStages(tenantId: string) {
  const existingStages = await db.query.leadStages.findMany({
    where: eq(leadStages.tenantId, tenantId),
    orderBy: [asc(leadStages.position)],
  });

  if (existingStages.length >= DEFAULT_LEAD_STAGES.length) {
    return existingStages;
  }

  for (const [index, stage] of DEFAULT_LEAD_STAGES.entries()) {
    const current = existingStages.find((item) => item.name === stage.name);

    if (current) {
      continue;
    }

    await db.insert(leadStages).values({
      id: createId(),
      tenantId,
      name: stage.name,
      color: stage.color,
      position: index,
      isSystem: true,
    });
  }

  return db.query.leadStages.findMany({
    where: eq(leadStages.tenantId, tenantId),
    orderBy: [asc(leadStages.position)],
  });
}
