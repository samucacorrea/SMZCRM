import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { LeadKanbanBoard } from "@/modules/leads/components/lead-kanban-board";
import { listLeadsByTenant, listLeadStagesByTenant } from "@/modules/leads/queries";

export async function LeadsKanbanPageView() {
  await assertPermission("leads", "view");
  const tenantContext = await getTenantContext();
  const [stages, leads] = await Promise.all([
    listLeadStagesByTenant(tenantContext.tenantId),
    listLeadsByTenant(tenantContext.tenantId),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Leads / Kanban
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Kanban de leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Página dedicada ao quadro, sem o formulário de cadastro misturado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-11 px-5" variant="outline">
            <Link href="/leads">Voltar para lista</Link>
          </Button>
          <Button asChild className="h-11 px-5">
            <Link href="/leads/new">Adicionar lead</Link>
          </Button>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Quadro operacional</CardTitle>
          <CardDescription>
            Mova os cards entre colunas para registrar avanço de estágio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadKanbanBoard
            stages={stages}
            leads={leads.map((lead) => ({
              id: lead.id,
              stageId: lead.stageId,
              name: lead.name,
              company: lead.company,
              source: lead.source,
              estimatedValueInCents: lead.estimatedValueInCents,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
