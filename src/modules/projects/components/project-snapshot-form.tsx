"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProjectSnapshotAction } from "@/modules/projects/actions";

export function ProjectSnapshotForm({
  project,
}: {
  project: {
    id: string;
    status: "planning" | "active" | "on_hold" | "completed" | "canceled";
    health: "healthy" | "attention" | "critical";
    progress: number;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(project.status);
  const [health, setHealth] = useState(project.health);
  const [progress, setProgress] = useState(String(project.progress));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="project-status">Status</Label>
        <select
          id="project-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof project.status)}
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="planning">Planejamento</option>
          <option value="active">Ativo</option>
          <option value="on_hold">Em pausa</option>
          <option value="completed">Concluído</option>
          <option value="canceled">Cancelado</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-health">Saúde</Label>
        <select
          id="project-health"
          value={health}
          onChange={(event) => setHealth(event.target.value as typeof project.health)}
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="healthy">Saudável</option>
          <option value="attention">Atenção</option>
          <option value="critical">Crítico</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-progress">Progresso (%)</Label>
        <Input
          id="project-progress"
          type="number"
          min="0"
          max="100"
          value={progress}
          onChange={(event) => setProgress(event.target.value)}
        />
      </div>
      <div className="md:col-span-3">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateProjectSnapshotAction(project.id, status, health, Number(progress));
              router.refresh();
            })
          }
        >
          {isPending ? "Salvando..." : "Atualizar projeto"}
        </Button>
      </div>
    </div>
  );
}
