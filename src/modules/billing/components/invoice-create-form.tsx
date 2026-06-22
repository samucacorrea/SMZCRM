"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInvoiceAction, type InvoiceActionState } from "@/modules/billing/actions";

const initialState: InvoiceActionState = {};

export function InvoiceCreateForm({
  customers,
  defaultCustomerId,
  defaultProjectId,
}: {
  customers: Array<{ id: string; legalName: string; tradeName: string | null }>;
  defaultCustomerId?: string;
  defaultProjectId?: string;
}) {
  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
      {defaultProjectId ? <input type="hidden" name="projectId" value={defaultProjectId} /> : null}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="customerId">Cliente</Label>
        <select
          id="customerId"
          name="customerId"
          defaultValue={defaultCustomerId ?? customers[0]?.id}
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.tradeName || customer.legalName}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" placeholder="Mensalidade, setup, taxa de mídia..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issueDate">Emissão</Label>
        <Input id="issueDate" name="issueDate" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Vencimento</Label>
        <Input id="dueDate" name="dueDate" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <Input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="2490.00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Moeda</Label>
        <Input id="currency" name="currency" defaultValue="BRL" maxLength={3} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="externalReference">Referência externa</Label>
        <Input id="externalReference" name="externalReference" placeholder="ASAAS-123, NFSE-456..." />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Informações adicionais da cobrança." />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Criando..." : "Criar fatura"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
