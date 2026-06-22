"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProjectHoursInvoiceForm } from "@/modules/billing/components/project-hours-invoice-form";
import { ProjectActiveTimersPanel } from "@/modules/projects/components/project-active-timers-panel";
import { ProjectTimeEntryForm } from "@/modules/projects/components/project-time-entry-form";
import { deleteProjectTimeEntryAction } from "@/modules/projects/actions";

type StaffOption = {
  id: string;
  displayName: string;
};

type TaskOption = {
  id: string;
  name: string;
  status: "todo" | "in_progress" | "done";
};

type TimeEntry = {
  id: string;
  workedAt: Date;
  durationMinutes: number;
  billable: boolean;
  rateInCents: number;
  amountInCents: number;
  notes: string | null;
  billedAt: Date | null;
  task: {
    id: string;
    name: string;
  } | null;
  invoice: {
    id: string;
    number: string;
  } | null;
  staff: {
    id: string;
    displayName: string;
  };
};

type ActiveTimer = {
  id: string;
  startedAt: Date;
  billable: boolean;
  notes: string | null;
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

export function ProjectTimeEntriesPanel({
  projectId,
  currency,
  owners,
  tasks,
  activeTimers,
  entries,
}: {
  projectId: string;
  currency: string;
  owners: StaffOption[];
  tasks: TaskOption[];
  activeTimers: ActiveTimer[];
  entries: TimeEntry[];
}) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const summary = useMemo(() => {
    const totals = entries.reduce(
      (accumulator, entry) => {
        accumulator.totalMinutes += entry.durationMinutes;
        if (entry.billable) {
          accumulator.billableMinutes += entry.durationMinutes;
          accumulator.billableAmountInCents += entry.amountInCents;
          if (!entry.invoice) {
            accumulator.pendingBillableMinutes += entry.durationMinutes;
            accumulator.pendingBillableAmountInCents += entry.amountInCents;
          }
        } else {
          accumulator.nonBillableMinutes += entry.durationMinutes;
        }
        return accumulator;
      },
      {
        totalMinutes: 0,
        billableMinutes: 0,
        nonBillableMinutes: 0,
        billableAmountInCents: 0,
        pendingBillableMinutes: 0,
        pendingBillableAmountInCents: 0,
      },
    );

    return totals;
  }, [entries]);

  return (
    <div className="space-y-5">
      <ProjectActiveTimersPanel projectId={projectId} timers={activeTimers} />

      <ProjectHoursInvoiceForm
        projectId={projectId}
        pendingBillableMinutes={summary.pendingBillableMinutes}
        pendingBillableAmountInCents={summary.pendingBillableAmountInCents}
        currency={currency}
      />

      <ProjectTimeEntryForm projectId={projectId} owners={owners} tasks={tasks} />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total lançado</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatMinutes(summary.totalMinutes)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Faturável</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatMinutes(summary.billableMinutes)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency,
            }).format(summary.billableAmountInCents / 100)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Não faturável</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatMinutes(summary.nonBillableMinutes)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 md:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pendente de faturamento</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="text-2xl font-semibold text-foreground">
              {formatMinutes(summary.pendingBillableMinutes)}
            </p>
            <p className="text-sm font-medium text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency,
              }).format(summary.pendingBillableAmountInCents / 100)}
            </p>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma hora registrada para este projeto.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-border bg-card">
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
                    <td className="px-4 py-3 text-sm text-foreground">
                      {entry.task?.name || "Tarefa removida"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {entry.staff.displayName}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(entry.workedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {formatMinutes(entry.durationMinutes)}
                    </td>
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
                            currency,
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {entry.notes || "Sem observações"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          startDeleting(async () => {
                            await deleteProjectTimeEntryAction(projectId, entry.id);
                            router.refresh();
                          })
                        }
                        disabled={isDeleting}
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
    </div>
  );
}
