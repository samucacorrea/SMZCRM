import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { LeadCreateForm } from "@/modules/leads/components/lead-create-form";
import { LeadImportForm } from "@/modules/leads/components/lead-import-form";
import { listLeadStagesByTenant } from "@/modules/leads/queries";
import Link from "next/link";

export async function LeadNewPageView() {
  await assertPermission("leads", "create");
  const tenantContext = await getTenantContext();
  const stages = await listLeadStagesByTenant(tenantContext.tenantId);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Leads / Novo
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Adicionar lead
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro separado da listagem e do kanban, como no fluxo dos templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-11 px-5" variant="outline">
            <Link href="/leads">Voltar para lista</Link>
          </Button>
          <Button asChild className="h-11 px-5" variant="outline">
            <Link href="/leads/kanban">Abrir kanban</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro manual</CardTitle>
            <CardDescription>Entrada focada em qualificação comercial.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadCreateForm stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importação CSV</CardTitle>
            <CardDescription>
              Base legada com mapeamento por estágio nominal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadImportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
