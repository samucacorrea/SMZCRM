"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  testInboundWebhookPayloadAction,
  type InboundWebhookActionState,
} from "@/modules/webhooks/actions";

const initialState: InboundWebhookActionState = {};

const payloadExample = `{
  "name": "Mariana Costa",
  "email": "mariana@empresa.com.br",
  "phone": "11999887766",
  "utm_source": "meta",
  "utm_campaign": "black-friday"
}`;

export function WebhookPayloadTestForm({ webhookId }: { webhookId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useMemo(
    () => testInboundWebhookPayloadAction.bind(null, webhookId),
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
      <div className="space-y-2">
        <Label htmlFor="payload">Payload de teste</Label>
        <Textarea
          id="payload"
          name="payload"
          placeholder={payloadExample}
          className="min-h-44 font-mono text-[12px] leading-5"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Processando..." : "Testar com este payload"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? (
          <p className="text-sm text-green-700">
            {state.success}
            {state.result ? ` Resultado: ${state.result}.` : ""}
            {state.leadId ? ` Lead: ${state.leadId}.` : ""}
          </p>
        ) : null}
      </div>
    </form>
  );
}
