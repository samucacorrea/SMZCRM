"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { stopProjectTimerAction } from "@/modules/projects/actions";

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

function formatElapsed(startedAt: Date) {
  const elapsedMs = Date.now() - startedAt.getTime();
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ProjectActiveTimersPanel({
  projectId,
  timers,
}: {
  projectId: string;
  timers: ActiveTimer[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (timers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum timer em andamento.
      </p>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {timers.map((timer) => (
        <div
          key={timer.id}
          className="rounded-xl border border-accent/30 bg-accent/5 p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Em andamento
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{timer.task.name}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Responsável: {timer.staff.displayName}</p>
                <p>
                  Iniciado em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(timer.startedAt)}
                </p>
                <p>Decorrido: {formatElapsed(timer.startedAt)}</p>
                <p>{timer.billable ? "Faturável" : "Interno"}</p>
                {timer.notes ? <p>{timer.notes}</p> : null}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await stopProjectTimerAction(projectId, timer.id);
                  router.refresh();
                })
              }
              disabled={isPending}
            >
              Encerrar timer
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
