"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeadAction, type LeadActionState } from "@/modules/leads/actions";

const initialState: LeadActionState = {};

export function LeadCreateForm({
  stages,
}: {
  stages: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, isPending] = useActionState(createLeadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Maria Oliveira" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <Input id="company" name="company" placeholder="Acme LTDA" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="maria@acme.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">Origem</Label>
        <Input id="source" name="source" placeholder="Inbound, Meta Ads, indicação..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stageId">Estágio</Label>
        <select
          id="stageId"
          name="stageId"
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          defaultValue={stages[0]?.id}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="estimatedValue">Valor estimado</Label>
        <Input id="estimatedValue" name="estimatedValue" type="number" min="0" step="0.01" placeholder="1500" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="tags">Etiquetas</Label>
        <Input id="tags" name="tags" placeholder="enterprise, urgente, inbound" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" placeholder="Contexto do lead, dor e próxima ação." />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar lead"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
