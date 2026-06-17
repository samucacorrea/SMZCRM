"use client";

import { useActionState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  closeWonLeadAction,
  type LeadActionState,
  markLeadLostAction,
  qualifyLeadAction,
} from "@/modules/leads/actions";

const initialState: LeadActionState = {};

function getQualificationLabel(value: "none" | "qualified" | "won" | "lost") {
  switch (value) {
    case "qualified":
      return "Qualificado";
    case "won":
      return "Ganho";
    case "lost":
      return "Perdido";
    default:
      return "Em aberto";
  }
}

export function LeadQualificationPanel({
  leadId,
  qualification,
  saleCurrency,
  lostReason,
}: {
  leadId: string;
  qualification: "none" | "qualified" | "won" | "lost";
  saleCurrency?: string | null;
  lostReason?: string | null;
}) {
  const router = useRouter();
  const [isQualifying, startQualify] = useTransition();
  const lostAction = useMemo(() => markLeadLostAction.bind(null, leadId), [leadId]);
  const wonAction = useMemo(() => closeWonLeadAction.bind(null, leadId), [leadId]);
  const [lostState, lostFormAction, lostPending] = useActionState(lostAction, initialState);
  const [wonState, wonFormAction, wonPending] = useActionState(wonAction, initialState);

  useEffect(() => {
    if (lostState.success || wonState.success) {
      router.refresh();
    }
  }, [lostState.success, router, wonState.success]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Status comercial
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          {getQualificationLabel(qualification)}
        </p>
        {qualification === "lost" && lostReason ? (
          <p className="mt-2 text-sm text-muted-foreground">Motivo: {lostReason}</p>
        ) : null}
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={isQualifying || qualification === "qualified" || qualification === "won"}
        onClick={() =>
          startQualify(async () => {
            await qualifyLeadAction(leadId);
            router.refresh();
          })
        }
      >
        {isQualifying ? "Qualificando..." : "Marcar como qualificado"}
      </Button>

      <form action={wonFormAction} className="space-y-3 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-medium text-foreground">Fechar como ganho</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`saleValue-${leadId}`}>Valor da venda</Label>
            <Input
              id={`saleValue-${leadId}`}
              name="saleValue"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="2500.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`currency-${leadId}`}>Moeda</Label>
            <Input
              id={`currency-${leadId}`}
              name="currency"
              defaultValue={saleCurrency || "BRL"}
              maxLength={3}
              placeholder="BRL"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={wonPending || qualification === "won"}>
            {wonPending ? "Fechando..." : "Fechar venda"}
          </Button>
          {wonState.error ? <p className="text-sm text-red-600">{wonState.error}</p> : null}
          {wonState.success ? <p className="text-sm text-green-700">{wonState.success}</p> : null}
        </div>
      </form>

      <form action={lostFormAction} className="space-y-3 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-medium text-foreground">Marcar como perdido</p>
        <div className="space-y-2">
          <Label htmlFor={`reason-${leadId}`}>Motivo da perda</Label>
          <Input
            id={`reason-${leadId}`}
            name="reason"
            placeholder="Sem orçamento ou sem fit"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" variant="outline" disabled={lostPending}>
            {lostPending ? "Salvando..." : "Marcar como perdido"}
          </Button>
          {lostState.error ? <p className="text-sm text-red-600">{lostState.error}</p> : null}
          {lostState.success ? <p className="text-sm text-green-700">{lostState.success}</p> : null}
        </div>
      </form>
    </div>
  );
}
