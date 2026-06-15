"use client";

import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateInboundWebhookAction,
  type InboundWebhookActionState,
} from "@/modules/webhooks/actions";

const initialState: InboundWebhookActionState = {};

export function WebhookSettingsForm({
  webhook,
  stages,
  staffMembers,
}: {
  webhook: {
    id: string;
    name: string;
    defaultStageId: string | null;
    defaultSource: string | null;
    defaultOwnerId: string | null;
    autoTags: string[];
    dedupKey: "email" | "phone" | "none";
    dedupAction: "create" | "update" | "note";
    unmappedPolicy: "ignore" | "store" | "notify";
    status: "active" | "paused";
    validation: Record<string, unknown>;
  };
  stages: Array<{ id: string; name: string }>;
  staffMembers: Array<{ id: string; displayName: string }>;
}) {
  const action = useMemo(
    () => updateInboundWebhookAction.bind(null, webhook.id),
    [webhook.id],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={webhook.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultSource">Origem padrão</Label>
          <Input
            id="defaultSource"
            name="defaultSource"
            defaultValue={webhook.defaultSource ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultStageId">Estágio inicial</Label>
          <select
            id="defaultStageId"
            name="defaultStageId"
            defaultValue={webhook.defaultStageId ?? ""}
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultOwnerId">Responsável padrão</Label>
          <select
            id="defaultOwnerId"
            name="defaultOwnerId"
            defaultValue={webhook.defaultOwnerId ?? ""}
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">Sem responsável fixo</option>
            {staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="autoTags">Etiquetas automáticas</Label>
          <Input
            id="autoTags"
            name="autoTags"
            defaultValue={webhook.autoTags.join(", ")}
            placeholder="meta, inbound, pago"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={webhook.status}
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dedupKey">Deduplicação</Label>
          <select
            id="dedupKey"
            name="dedupKey"
            defaultValue={webhook.dedupKey}
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
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
            defaultValue={webhook.dedupAction}
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="create">Criar novo</option>
            <option value="update">Atualizar lead</option>
            <option value="note">Gerar nota</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unmappedPolicy">Campos não mapeados</Label>
          <select
            id="unmappedPolicy"
            name="unmappedPolicy"
            defaultValue={webhook.unmappedPolicy}
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="ignore">Ignorar</option>
            <option value="store">Guardar em dados extras</option>
            <option value="notify">Guardar e notificar admin</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="requireEmailOrPhone">Validação mínima</Label>
          <select
            id="requireEmailOrPhone"
            name="requireEmailOrPhone"
            defaultValue={
              webhook.validation.requireEmailOrPhone === false ? "false" : "true"
            }
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="true">Exigir e-mail ou telefone</option>
            <option value="false">Aceitar sem contato</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="createCustomerOnLeadCreate">Criar cliente automaticamente</Label>
          <select
            id="createCustomerOnLeadCreate"
            name="createCustomerOnLeadCreate"
            defaultValue={
              webhook.validation.createCustomerOnLeadCreate === false ? "false" : "true"
            }
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="true">Sim, criar ou sincronizar cliente</option>
            <option value="false">Não, manter apenas lead</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar configuração"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
