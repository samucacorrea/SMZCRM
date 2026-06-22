"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectTaskAction, type ProjectActionState } from "@/modules/projects/actions";

const initialState: ProjectActionState = {};

type StaffOption = {
  id: string;
  displayName: string;
};

export function ProjectTaskForm({
  projectId,
  owners,
}: {
  projectId: string;
  owners: StaffOption[];
}) {
  const action = useMemo(() => createProjectTaskAction.bind(null, projectId), [projectId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor="project-task-name">Nova tarefa</Label>
          <Input
            id="project-task-name"
            name="name"
            placeholder="Ex.: revisar sprint, aprovar criativos ou validar entrega."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-task-priority">Prioridade</Label>
          <select
            id="project-task-priority"
            name="priority"
            defaultValue="medium"
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="low">Baixa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-task-due-date">Prazo</Label>
          <Input id="project-task-due-date" name="dueDate" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-task-description">Descricao</Label>
        <Textarea
          id="project-task-description"
          name="description"
          placeholder="Defina objetivo, contexto e criterio de conclusao."
        />
      </div>

      <div className="space-y-2">
        <Label>Responsáveis</Label>
        <div className="grid gap-2 rounded-xl border border-border bg-background p-3 md:grid-cols-2 xl:grid-cols-3">
          {owners.map((owner) => (
            <label key={owner.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="assignedStaffMemberIds"
                value={owner.id}
                className="h-4 w-4 rounded border-border"
              />
              {owner.displayName}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Criando..." : "Criar tarefa"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
