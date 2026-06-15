"use client";

import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  rotateInboundWebhookSecretAction,
  type InboundWebhookActionState,
} from "@/modules/webhooks/actions";

const initialState: InboundWebhookActionState = {};

export function WebhookSecretRotateForm({ webhookId }: { webhookId: string }) {
  const action = useMemo(
    () => rotateInboundWebhookSecretAction.bind(null, webhookId),
    [webhookId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Rotacionando..." : "Gerar novo token"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
      {state.secret && state.webhookUrl ? (
        <div className="rounded-xl border border-border bg-background p-4 text-sm">
          <p className="font-medium text-foreground">Novo segredo</p>
          <p className="mt-2 break-all text-muted-foreground">URL: {state.webhookUrl}</p>
          <p className="break-all text-muted-foreground">Token: {state.secret}</p>
        </div>
      ) : null}
    </form>
  );
}
