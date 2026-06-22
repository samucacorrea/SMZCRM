import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { listBillableCustomersByTenant } from "@/modules/billing/queries";
import { ProjectCreateForm } from "@/modules/projects/components/project-create-form";
import { ProjectsPanel } from "@/modules/projects/components/projects-panel";
import {
  listProjectsByTenant,
  listProjectTaskStatsByTenant,
  listProjectTimeEntryStatsByTenant,
} from "@/modules/projects/queries";

export async function ProjectsPageView() {
  await assertPermission("crm", "view");
  const tenantContext = await getTenantContext();
  const [projects, customers, taskStats, timeStats] = await Promise.all([
    listProjectsByTenant(tenantContext.tenantId),
    listBillableCustomersByTenant(tenantContext.tenantId),
    listProjectTaskStatsByTenant(tenantContext.tenantId),
    listProjectTimeEntryStatsByTenant(tenantContext.tenantId),
  ]);

  const enrichedProjects = projects.map((project) => ({
    ...project,
    taskStats: taskStats.get(project.id) ?? { total: 0, open: 0 },
    timeStats: timeStats.get(project.id) ?? {
      totalMinutes: 0,
      billableMinutes: 0,
      billableAmountInCents: 0,
    },
  }));

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Projetos
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operação pós-venda com vínculo ao cliente, orçamento e status executivo.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Projetos</p>
          <p className="text-lg font-semibold text-foreground">{enrichedProjects.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Ativos</p>
          <p className="text-lg font-semibold text-foreground">
            {enrichedProjects.filter((project) => project.status === "active").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Em atenção</p>
          <p className="text-lg font-semibold text-foreground">
            {enrichedProjects.filter((project) => project.health !== "healthy").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Orçado</p>
          <p className="text-lg font-semibold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(
              enrichedProjects.reduce((total, project) => total + project.budgetInCents, 0) / 100,
            )}
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Novo projeto</CardTitle>
            <CardDescription>Crie o projeto já ligado a um cliente e modelo de faturamento.</CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                Cadastre um cliente antes de abrir o primeiro projeto.
              </p>
            ) : (
              <ProjectCreateForm customers={customers} />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Projetos em andamento</CardTitle>
            <CardDescription>Lista operacional com acesso ao detalhe do projeto.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectsPanel projects={enrichedProjects} showCustomer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
