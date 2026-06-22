"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectTimeEntryAction,
  type ProjectActionState,
} from "@/modules/projects/actions";

const initialState: ProjectActionState = {};

type StaffOption = {
  id: string;
  displayName: string;
};

type TaskOption = {
  id: string;
  name: string;
  status: "todo" | "in_progress" | "done";
};

export function ProjectTimeEntryForm({
  projectId,
  owners,
  tasks,
}: {
  projectId: string;
  owners: StaffOption[];
  tasks: TaskOption[];
}) {
  const action = useMemo(() => createProjectTimeEntryAction.bind(null, projectId), [projectId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor="time-entry-task">Tarefa</Label>
          <select
            id="time-entry-task"
            name="taskId"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="" disabled>
              Selecione uma tarefa
            </option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-entry-staff">Responsável</Label>
          <select
            id="time-entry-staff"
            name="staffId"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="" disabled>
              Selecione um membro
            </option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-entry-worked-at">Data e hora</Label>
          <Input id="time-entry-worked-at" name="workedAt" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-entry-duration">Duração (min)</Label>
          <Input
            id="time-entry-duration"
            name="durationMinutes"
            type="number"
            min="1"
            max="1440"
            placeholder="90"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="time-entry-notes">Observações</Label>
        <Textarea
          id="time-entry-notes"
          name="notes"
          placeholder="Ex.: revisão com cliente, ajustes de campanha, alinhamento interno."
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="billable" defaultChecked className="h-4 w-4 rounded border-border" />
        Lançamento faturável
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar hora"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
