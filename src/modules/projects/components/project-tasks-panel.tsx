"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProjectTaskForm } from "@/modules/projects/components/project-task-form";
import {
  deleteProjectTaskAction,
  startProjectTimerAction,
  updateProjectTaskStatusAction,
} from "@/modules/projects/actions";

type StaffOption = {
  id: string;
  displayName: string;
};

type ProjectTaskItem = {
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

const priorityLabel: Record<ProjectTaskItem["priority"], string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const columns = [
  {
    key: "todo",
    title: "A fazer",
    tone: "bg-slate-500",
  },
  {
    key: "in_progress",
    title: "Em andamento",
    tone: "bg-primary",
  },
  {
    key: "done",
    title: "Concluidas",
    tone: "bg-accent",
  },
] as const;

export function ProjectTasksPanel({
  projectId,
  currentStaffId,
  activeTimerTaskIds,
  owners,
  tasks,
}: {
  projectId: string;
  currentStaffId: string;
  activeTimerTaskIds: string[];
  owners: StaffOption[];
  tasks: ProjectTaskItem[];
}) {
  const router = useRouter();
  const [isUpdating, startUpdating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done"),
    }),
    [tasks],
  );

  return (
    <div className="space-y-5">
      <ProjectTaskForm projectId={projectId} owners={owners} />

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma tarefa operacional cadastrada para este projeto.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {columns.map((column) => (
            <section
              key={column.key}
              className="rounded-2xl border border-border bg-background/70 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${column.tone}`} />
                  <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                </div>
                <span className="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground">
                  {groupedTasks[column.key].length}
                </span>
              </div>

              <div className="space-y-3">
                {groupedTasks[column.key].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card px-3 py-8 text-center text-xs text-muted-foreground">
                    Sem tarefas nesta coluna.
                  </div>
                ) : (
                  groupedTasks[column.key].map((task) => (
                    <article key={task.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                            {priorityLabel[task.priority]}
                          </span>
                          {task.dueDate ? (
                            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              {new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(task.dueDate)}
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-foreground">{task.name}</p>
                          {task.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                          ) : null}
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            Responsáveis:{" "}
                            {task.assignees.map((assignee) => assignee.staff.displayName).join(", ")}
                          </p>
                          {task.completedAt ? (
                            <p>
                              Concluida em{" "}
                              {new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(task.completedAt)}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {task.status !== "todo" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                startUpdating(async () => {
                                  await updateProjectTaskStatusAction(projectId, task.id, "todo");
                                  router.refresh();
                                })
                              }
                              disabled={isUpdating}
                            >
                              Reabrir
                            </Button>
                          ) : null}
                          {task.status !== "in_progress" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                startUpdating(async () => {
                                  await updateProjectTaskStatusAction(projectId, task.id, "in_progress");
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
                                  await updateProjectTaskStatusAction(projectId, task.id, "done");
                                  router.refresh();
                                })
                              }
                              disabled={isUpdating}
                            >
                              Concluir
                            </Button>
                          ) : null}
                          {!activeTimerTaskIds.includes(task.id) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                startUpdating(async () => {
                                  await startProjectTimerAction(projectId, task.id, {
                                    staffId: currentStaffId,
                                    billable: true,
                                  });
                                  router.refresh();
                                })
                              }
                              disabled={isUpdating}
                            >
                              Iniciar timer
                            </Button>
                          ) : (
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                              Timer ativo
                            </span>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              startDeleting(async () => {
                                await deleteProjectTaskAction(projectId, task.id);
                                router.refresh();
                              })
                            }
                            disabled={isDeleting}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
