"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInboundWebhookAction,
  type InboundWebhookActionState,
} from "@/modules/webhooks/actions";

const initialState: InboundWebhookActionState = {};

export function InboundWebhookCreateForm({
  stages,
}: {
  stages: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, isPending] = useActionState(
    createInboundWebhookAction,
    initialState,
  );
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
        <Input id="name" name="name" placeholder="Meta Lead Ads" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultSource">Origem padrão</Label>
        <Input id="defaultSource" name="defaultSource" placeholder="Webhook / Meta" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultStageId">Estágio inicial</Label>
        <select
          id="defaultStageId"
          name="defaultStageId"
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
        <Label htmlFor="autoTags">Etiquetas automáticas</Label>
        <Input id="autoTags" name="autoTags" placeholder="meta, paid, inbound" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dedupKey">Deduplicação</Label>
        <select
          id="dedupKey"
          name="dedupKey"
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          defaultValue="email"
        >
          <option value="email">Por e-mail</option>
          <option value="phone">Por telefone</option>
          <option value="none">Sem deduplicação</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dedupAction">Ação na deduplicação</Label>
        <select
          id="dedupAction"
          name="dedupAction"
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          defaultValue="create"
        >
          <option value="create">Criar novo</option>
          <option value="update">Atualizar lead</option>
          <option value="note">Gerar nota</option>
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar webhook"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
      {state.secret && state.webhookUrl ? (
        <div className="md:col-span-2 rounded-xl border border-border bg-background p-4 text-sm">
          <p className="font-medium text-foreground">Credenciais geradas</p>
          <p className="mt-2 text-muted-foreground">URL: {state.webhookUrl}</p>
          <p className="text-muted-foreground">Token: {state.secret}</p>
        </div>
      ) : null}
    </form>
  );
}
