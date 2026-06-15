"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createWebhookMappingAction,
  type InboundWebhookActionState,
} from "@/modules/webhooks/actions";

const initialState: InboundWebhookActionState = {};

const leadTargets = [
  { value: "name", label: "Lead / Nome" },
  { value: "company", label: "Lead / Empresa" },
  { value: "email", label: "Lead / E-mail" },
  { value: "phone", label: "Lead / Telefone" },
  { value: "source", label: "Lead / Origem" },
  { value: "description", label: "Lead / Descricao" },
  { value: "tags", label: "Lead / Tags" },
];

const attributionTargets = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "gclid",
  "fbclid",
  "fbp",
  "fbc",
  "ttclid",
  "ctwaClid",
  "referral",
  "pageUrl",
  "referrer",
];

export function WebhookMappingCreateForm({
  webhookId,
  customFields,
}: {
  webhookId: string;
  customFields: Array<{ key: string; label: string }>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useMemo(
    () => createWebhookMappingAction.bind(null, webhookId),
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
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sourceField">Campo do payload</Label>
          <Input id="sourceField" name="sourceField" placeholder="contact.phone ou utm_source" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetType">Destino</Label>
          <select
            id="targetType"
            name="targetType"
            defaultValue="lead_field"
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="lead_field">Campo padrao do lead</option>
            <option value="attribution_field">Campo de atribuicao</option>
            <option value="custom_field">Campo personalizado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetKey">Chave de destino</Label>
          <input
            id="targetKey"
            name="targetKey"
            list="webhook-target-keys"
            placeholder="name, utmSource ou custom_key"
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          />
          <datalist id="webhook-target-keys">
            {leadTargets.map((target) => (
              <option key={target.value} value={target.value}>
                {target.label}
              </option>
            ))}
            {attributionTargets.map((target) => (
              <option key={target} value={target}>
                Atribuicao / {target}
              </option>
            ))}
            {customFields.map((field) => (
              <option key={field.key} value={field.key}>
                Personalizado / {field.label}
              </option>
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transformType">Transformacao</Label>
          <select
            id="transformType"
            name="transformType"
            defaultValue="none"
            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="none">Nenhuma</option>
            <option value="phone_e164">Telefone E.164</option>
            <option value="lowercase">Lowercase</option>
            <option value="uppercase">Uppercase</option>
            <option value="titlecase">Title Case</option>
            <option value="cpf_digits">CPF só dígitos</option>
            <option value="cep_digits">CEP só dígitos</option>
            <option value="date_iso">Data ISO</option>
            <option value="fixed">Valor fixo</option>
            <option value="conditional">Condicional simples</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transformValue">Valor fixo</Label>
        <Input
          id="transformValue"
          name="transformValue"
          placeholder="Para fixed: valor. Para conditional: esperado|se_true|se_false"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Adicionar mapeamento"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
