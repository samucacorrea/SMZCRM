"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLeadReminderAction, type LeadActionState } from "@/modules/leads/actions";

const initialState: LeadActionState = {};

export function LeadReminderForm({ leadId }: { leadId: string }) {
  const action = useMemo(() => createLeadReminderAction.bind(null, leadId), [leadId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1.35fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor="description">Novo lembrete</Label>
          <Input
            id="description"
            name="description"
            placeholder="Ex.: ligar para validar proposta ou cobrar retorno."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remindAt">Quando lembrar</Label>
          <Input id="remindAt" name="remindAt" type="datetime-local" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          name="notifyCustomer"
          type="checkbox"
          value="on"
          className="h-4 w-4 rounded border-border"
        />
        Sinalizar que esse lembrete tambem envolve contato com o cliente
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Agendando..." : "Criar lembrete"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
