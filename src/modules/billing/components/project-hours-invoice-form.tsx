"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectHoursInvoiceAction,
  type InvoiceActionState,
} from "@/modules/billing/actions";

const initialState: InvoiceActionState = {};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${String(remaining).padStart(2, "0")}`;
}

export function ProjectHoursInvoiceForm({
  projectId,
  pendingBillableMinutes,
  pendingBillableAmountInCents,
  currency,
}: {
  projectId: string;
  pendingBillableMinutes: number;
  pendingBillableAmountInCents: number;
  currency: string;
}) {
  const [state, formAction, isPending] = useActionState(createProjectHoursInvoiceAction, initialState);

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Faturar horas pendentes</p>
          <p className="text-sm text-muted-foreground">
            Gera uma fatura em rascunho com todas as horas faturáveis ainda não vinculadas.
          </p>
        </div>
        <div className="grid gap-2 text-right text-sm">
          <div>
            <span className="text-muted-foreground">Horas pendentes: </span>
            <span className="font-medium text-foreground">{formatMinutes(pendingBillableMinutes)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Valor pendente: </span>
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency,
              }).format(pendingBillableAmountInCents / 100)}
            </span>
          </div>
        </div>
      </div>

      <form action={formAction} className="mt-4 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="space-y-2">
          <Label htmlFor="project-hours-issue-date">Emissão</Label>
          <Input id="project-hours-issue-date" name="issueDate" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-hours-due-date">Vencimento</Label>
          <Input id="project-hours-due-date" name="dueDate" type="datetime-local" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="project-hours-notes">Observações</Label>
          <Textarea
            id="project-hours-notes"
            name="notes"
            rows={3}
            placeholder="Resumo adicional para acompanhar a cobrança."
          />
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <Button
            type="submit"
            size="sm"
            disabled={isPending || pendingBillableAmountInCents <= 0}
          >
            {isPending ? "Gerando..." : "Gerar fatura das horas"}
          </Button>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
        </div>
      </form>
    </div>
  );
}
