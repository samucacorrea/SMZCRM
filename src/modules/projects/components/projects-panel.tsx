"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteProjectAction, updateProjectSnapshotAction } from "@/modules/projects/actions";

type Project = {
  id: string;
  name: string;
  description: string | null;
  billingType: "fixed" | "project_hour" | "task_hour";
  status: "planning" | "active" | "on_hold" | "completed" | "canceled";
  health: "healthy" | "attention" | "critical";
  currency: string;
  rateInCents: number;
  budgetInCents: number;
  progress: number;
  dueDate: Date | null;
  taskStats?: {
    total: number;
    open: number;
  };
  timeStats?: {
    totalMinutes: number;
    billableMinutes: number;
    billableAmountInCents: number;
  };
  customer?: {
    legalName: string;
    tradeName: string | null;
  };
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${String(remaining).padStart(2, "0")}`;
}

const statusLabel: Record<Project["status"], string> = {
  planning: "Planejamento",
  active: "Ativo",
  on_hold: "Em pausa",
  completed: "Concluído",
  canceled: "Cancelado",
};

const healthLabel: Record<Project["health"], string> = {
  healthy: "Saudável",
  attention: "Atenção",
  critical: "Crítico",
};

const billingLabel: Record<Project["billingType"], string> = {
  fixed: "Valor fixo",
  project_hour: "Hora de projeto",
  task_hour: "Hora de tarefa",
};

export function ProjectsPanel({
  projects,
  showCustomer = false,
}: {
  projects: Project[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum projeto cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div key={project.id} className="rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {statusLabel[project.status]}
                </span>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  {healthLabel[project.health]}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {billingLabel[project.billingType]}
                </span>
              </div>
              <Link href={`/projects/${project.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                {project.name}
              </Link>
              {project.description ? (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {showCustomer && project.customer ? (
                  <span>Cliente: {project.customer.tradeName || project.customer.legalName}</span>
                ) : null}
                {project.taskStats ? (
                  <span>
                    {project.taskStats.total} tarefas · {project.taskStats.open} abertas
                  </span>
                ) : null}
                {project.timeStats ? (
                  <span>
                    {formatMinutes(project.timeStats.billableMinutes)} faturáveis ·{" "}
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: project.currency,
                      }).format(project.timeStats.billableAmountInCents / 100)}
                    </span>
                  </span>
                ) : null}
                <span>
                  Orçamento:{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: project.currency,
                  }).format(project.budgetInCents / 100)}
                </span>
                <span>Progresso: {project.progress}%</span>
                {project.dueDate ? (
                  <span>
                    Prazo:{" "}
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(project.dueDate)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {project.status !== "active" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    startTransition(async () => {
                      await updateProjectSnapshotAction(project.id, "active", project.health, project.progress);
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  Ativar
                </Button>
              ) : null}
              {project.status !== "completed" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await updateProjectSnapshotAction(project.id, "completed", "healthy", 100);
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  Concluir
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  startTransition(async () => {
                    await deleteProjectAction(project.id);
                    router.refresh();
                  })
                }
                disabled={isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
