"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteProjectTimeEntryAction, stopProjectTimerAction } from "@/modules/projects/actions";

type FilterOption = {
  id: string;
  label: string;
};

type TimeEntry = {
  id: string;
  workedAt: Date;
  durationMinutes: number;
  billable: boolean;
  amountInCents: number;
  notes: string | null;
  project: {
    id: string;
    name: string;
    currency: string;
  };
  task: {
    id: string;
    name: string;
  } | null;
  staff: {
    id: string;
    displayName: string;
  };
  invoice: {
    id: string;
    number: string;
  } | null;
};

type ActiveTimer = {
  id: string;
  startedAt: Date;
  billable: boolean;
  notes: string | null;
  project: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    name: string;
  };
  staff: {
    id: string;
    displayName: string;
  };
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${String(remaining).padStart(2, "0")}`;
}

function formatElapsed(startedAt: Date) {
  const elapsedMs = Date.now() - startedAt.getTime();
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimesheetsPanel({
  filters,
  projects,
  staffMembers,
  entries,
  activeTimers,
}: {
  filters: {
    projectId?: string;
    staffId?: string;
    billable?: "all" | "true" | "false";
  };
  projects: FilterOption[];
  staffMembers: FilterOption[];
  entries: TimeEntry[];
  activeTimers: ActiveTimer[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(() => {
    return entries.reduce(
      (accumulator, entry) => {
        accumulator.totalMinutes += entry.durationMinutes;
        if (entry.billable) {
          accumulator.billableMinutes += entry.durationMinutes;
          accumulator.billableAmountInCents += entry.amountInCents;
          if (!entry.invoice) {
            accumulator.pendingBillableMinutes += entry.durationMinutes;
            accumulator.pendingBillableAmountInCents += entry.amountInCents;
          }
        }
        return accumulator;
      },
      {
        totalMinutes: 0,
        billableMinutes: 0,
        billableAmountInCents: 0,
        pendingBillableMinutes: 0,
        pendingBillableAmountInCents: 0,
      },
    );
  }, [entries]);

  return (
    <div className="space-y-5">
      <form className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <div className="space-y-2">
          <label htmlFor="timesheets-project" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Projeto
          </label>
          <select
            id="timesheets-project"
            name="projectId"
            defaultValue={filters.projectId ?? ""}
            className="flex h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">Todos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="timesheets-staff" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Responsável
          </label>
          <select
            id="timesheets-staff"
            name="staffId"
            defaultValue={filters.staffId ?? ""}
            className="flex h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">Todos</option>
            {staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="timesheets-billable" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Tipo
          </label>
          <select
            id="timesheets-billable"
            name="billable"
            defaultValue={filters.billable ?? "all"}
            className="flex h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="all">Todos</option>
            <option value="true">Faturáveis</option>
            <option value="false">Internos</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => router.push("/timesheets")}>
            Limpar
          </Button>
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Horas lançadas</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatMinutes(summary.totalMinutes)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Horas faturáveis</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatMinutes(summary.billableMinutes)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valor faturável</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summary.billableAmountInCents / 100)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pendentes de fatura</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatMinutes(summary.pendingBillableMinutes)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summary.pendingBillableAmountInCents / 100)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Timers ativos</p>
            <p className="text-sm text-muted-foreground">Acompanhamento em tempo real do esforço em aberto.</p>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {activeTimers.length} ativo(s)
          </span>
        </div>

        {activeTimers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum timer em andamento para os filtros aplicados.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeTimers.map((timer) => (
              <div key={timer.id} className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Em andamento
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{timer.task.name}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Projeto: {timer.project.name}</p>
                      <p>Responsável: {timer.staff.displayName}</p>
                      <p>Decorrido: {formatElapsed(timer.startedAt)}</p>
                      <p>{timer.billable ? "Faturável" : "Interno"}</p>
                      {timer.notes ? <p>{timer.notes}</p> : null}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await stopProjectTimerAction(timer.project.id, timer.id);
                        router.refresh();
                      })
                    }
                  >
                    Encerrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">Lançamentos recentes</p>
          <p className="text-sm text-muted-foreground">Histórico operacional consolidado por projeto e responsável.</p>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado para os filtros aplicados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b border-border bg-card">
                  <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Projeto</th>
                    <th className="px-4 py-3 font-medium">Tarefa</th>
                    <th className="px-4 py-3 font-medium">Responsável</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Duração</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Fatura</th>
                    <th className="px-4 py-3 font-medium">Observações</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="align-top">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{entry.project.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.task?.name || "Tarefa removida"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.staff.displayName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(entry.workedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{formatMinutes(entry.durationMinutes)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            entry.billable
                              ? "rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"
                              : "rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                          }
                        >
                          {entry.billable ? "Faturável" : "Interno"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {entry.billable
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: entry.project.currency,
                            }).format(entry.amountInCents / 100)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {entry.invoice ? (
                          <span className="font-medium text-foreground">{entry.invoice.number}</span>
                        ) : entry.billable ? (
                          <span className="text-primary">A faturar</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.notes || "Sem observações"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteProjectTimeEntryAction(entry.project.id, entry.id);
                              router.refresh();
                            })
                          }
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
