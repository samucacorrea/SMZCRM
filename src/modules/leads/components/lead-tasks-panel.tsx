"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LeadTaskForm } from "@/modules/leads/components/lead-task-form";
import { deleteLeadTaskAction, updateLeadTaskStatusAction } from "@/modules/leads/actions";

type StaffOption = {
  id: string;
  displayName: string;
};

type LeadTaskItem = {
  id: string;
  name: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done";
  dueDate: Date | null;
  completedAt: Date | null;
  assignees: Array<{
    staff: {
      id: string;
      displayName: string;
    };
  }>;
};

const priorityLabel: Record<LeadTaskItem["priority"], string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const statusLabel: Record<LeadTaskItem["status"], string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  done: "Concluida",
};

export function LeadTasksPanel({
  leadId,
  owners,
  tasks,
}: {
  leadId: string;
  owners: StaffOption[];
  tasks: LeadTaskItem[];
}) {
  const router = useRouter();
  const [isUpdating, startUpdating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      inProgress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done"),
    }),
    [tasks],
  );

  return (
    <div className="space-y-4">
      <LeadTaskForm leadId={leadId} owners={owners} />

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma tarefa vinculada a este lead.
        </p>
      ) : (
        <div className="space-y-4">
          {[...groupedTasks.todo, ...groupedTasks.inProgress, ...groupedTasks.done].map((task) => (
            <div key={task.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {statusLabel[task.status]}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {priorityLabel[task.priority]}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-foreground">{task.name}</p>
                  {task.description ? (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Responsáveis:{" "}
                      {task.assignees.map((assignee) => assignee.staff.displayName).join(", ")}
                    </span>
                    <span>
                      Prazo:{" "}
                      {task.dueDate
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(task.dueDate)
                        : "Sem prazo"}
                    </span>
                    {task.completedAt ? (
                      <span>
                        Concluida em{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(task.completedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.status !== "in_progress" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        startUpdating(async () => {
                          await updateLeadTaskStatusAction(leadId, task.id, "in_progress");
                          router.refresh();
                        })
                      }
                      disabled={isUpdating}
                    >
                      Em andamento
                    </Button>
                  ) : null}
                  {task.status !== "done" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        startUpdating(async () => {
                          await updateLeadTaskStatusAction(leadId, task.id, "done");
                          router.refresh();
                        })
                      }
                      disabled={isUpdating}
                    >
                      Concluir
                    </Button>
                  ) : null}
                  {task.status !== "todo" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        startUpdating(async () => {
                          await updateLeadTaskStatusAction(leadId, task.id, "todo");
                          router.refresh();
                        })
                      }
                      disabled={isUpdating}
                    >
                      Reabrir
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startDeleting(async () => {
                        await deleteLeadTaskAction(leadId, task.id);
                        router.refresh();
                      })
                    }
                    disabled={isDeleting}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
