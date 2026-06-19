"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeadFollowUpAction, type LeadActionState } from "@/modules/leads/actions";

const initialState: LeadActionState = {};

export function LeadFollowUpForm({ leadId }: { leadId: string }) {
  const action = useMemo(() => createLeadFollowUpAction.bind(null, leadId), [leadId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="channel">Canal</Label>
          <select
            id="channel"
            name="channel"
            defaultValue="whatsapp"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="call">Ligação</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="meeting">Reunião</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="outcome">Resultado</Label>
          <select
            id="outcome"
            name="outcome"
            defaultValue="pending"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="pending">Pendente</option>
            <option value="answered">Respondeu</option>
            <option value="no_answer">Sem resposta</option>
            <option value="interested">Interessado</option>
            <option value="not_interested">Sem interesse</option>
            <option value="scheduled">Agendado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="happenedAt">Data do contato</Label>
          <Input id="happenedAt" name="happenedAt" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Resumo</Label>
        <Textarea
          id="summary"
          name="summary"
          placeholder="Ex.: lead respondeu pedindo uma proposta revisada com parcelamento."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextAction">Próxima ação</Label>
        <Textarea
          id="nextAction"
          name="nextAction"
          placeholder="Ex.: enviar atualização até amanhã ou agendar reunião."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar follow-up"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
