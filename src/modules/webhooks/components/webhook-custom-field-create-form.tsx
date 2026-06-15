"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createWebhookCustomFieldAction,
  type InboundWebhookActionState,
} from "@/modules/webhooks/actions";

const initialState: InboundWebhookActionState = {};

export function WebhookCustomFieldCreateForm({ webhookId }: { webhookId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useMemo(
    () => createWebhookCustomFieldAction.bind(null, webhookId),
    [webhookId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="label">Nome</Label>
          <Input id="label" name="label" placeholder="CPF do responsavel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="key">Chave</Label>
          <Input id="key" name="key" placeholder="cpf_responsavel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataType">Tipo</Label>
          <select
            id="dataType"
            name="dataType"
            defaultValue="text"
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="text">Texto</option>
            <option value="number">Numero</option>
            <option value="date">Data</option>
            <option value="boolean">Booleano</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Criando..." : "Criar campo personalizado"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
