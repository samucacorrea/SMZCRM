import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { InvoicesPanel } from "@/modules/billing/components/invoices-panel";
import { listInvoicesByTenant } from "@/modules/billing/queries";
import { ProjectSnapshotForm } from "@/modules/projects/components/project-snapshot-form";
import { ProjectTimeEntriesPanel } from "@/modules/projects/components/project-time-entries-panel";
import { ProjectTasksPanel } from "@/modules/projects/components/project-tasks-panel";
import {
  listProjectActiveTimersByProject,
  getProjectById,
  listProjectOwnersByTenant,
  listProjectTimeEntriesByProject,
  listProjectTasksByProject,
} from "@/modules/projects/queries";

export async function ProjectProfilePageView({ projectId }: { projectId: string }) {
  await assertPermission("crm", "view");
  const tenantContext = await getTenantContext();
  const project = await getProjectById(tenantContext.tenantId, projectId);

  if (!project) {
    notFound();
  }

  const [projectInvoices, owners, projectTasks, projectTimeEntries, projectActiveTimers] = await Promise.all([
    listInvoicesByTenant(tenantContext.tenantId, {
      projectId: project.id,
    }),
    listProjectOwnersByTenant(tenantContext.tenantId),
    listProjectTasksByProject(tenantContext.tenantId, project.id),
    listProjectTimeEntriesByProject(tenantContext.tenantId, project.id),
    listProjectActiveTimersByProject(tenantContext.tenantId, project.id),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Projetos / Detalhe
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliente:{" "}
            <Link href={`/customers/${project.customerId}`} className="font-medium text-primary">
              {project.customer.tradeName || project.customer.legalName}
            </Link>
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <p>Status: {project.status}</p>
            <p>Saúde: {project.health}</p>
            <p>Faturamento: {project.billingType}</p>
            <p>Progresso: {project.progress}%</p>
            <p>
              Valor hora:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: project.currency,
              }).format(project.rateInCents / 100)}
            </p>
            <p>
              Orçamento:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: project.currency,
              }).format(project.budgetInCents / 100)}
            </p>
            <p>
              Início:{" "}
              {project.startDate
                ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(project.startDate)
                : "Não informado"}
            </p>
            <p>
              Prazo:{" "}
              {project.dueDate
                ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(project.dueDate)
                : "Não informado"}
            </p>
            <p className="sm:col-span-2">Descrição: {project.description || "Sem descrição"}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardHeader>
            <CardTitle>Snapshot executivo</CardTitle>
            <CardDescription>Status, saúde e progresso visíveis para a operação.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectSnapshotForm project={project} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1 bg-primary/80" />
        <CardHeader>
          <CardTitle>Operação do projeto</CardTitle>
          <CardDescription>
            Quadro de tarefas para execução diária, acompanhamento e entrega.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTasksPanel
            projectId={project.id}
            currentStaffId={tenantContext.staffMemberId}
            activeTimerTaskIds={projectActiveTimers.map((timer) => timer.task.id)}
            owners={owners}
            tasks={projectTasks}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-accent/80" />
        <CardHeader>
          <CardTitle>Horas e faturamento operacional</CardTitle>
          <CardDescription>
            Lançamentos manuais por tarefa para acompanhar esforço e valor faturável.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTimeEntriesPanel
            projectId={project.id}
            currency={project.currency}
            owners={owners}
            tasks={projectTasks.map((task) => ({
              id: task.id,
              name: task.name,
              status: task.status,
            }))}
            activeTimers={projectActiveTimers}
            entries={projectTimeEntries}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-primary/70" />
        <CardHeader>
          <CardTitle>Contato principal do cliente</CardTitle>
          <CardDescription>Referência rápida para condução do projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          {project.customer.contacts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
              Este cliente ainda não possui contatos cadastrados.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {project.customer.contacts.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.jobTitle || "Sem cargo"}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>{contact.email}</p>
                    <p>{contact.phone || contact.whatsapp || "Sem telefone"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-accent/70" />
        <CardHeader>
          <CardTitle>Faturas do projeto</CardTitle>
          <CardDescription>Horas faturadas e cobranças manuais vinculadas diretamente a este projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesPanel invoices={projectInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
