"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeadProposalAction, type LeadActionState } from "@/modules/leads/actions";

const initialState: LeadActionState = {};

type ProposalItemDraft = {
  description: string;
  quantity: number;
  unitPrice: number;
};

const emptyItem = (): ProposalItemDraft => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export function LeadProposalForm({ leadId }: { leadId: string }) {
  const action = useMemo(() => createLeadProposalAction.bind(null, leadId), [leadId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<ProposalItemDraft[]>([emptyItem()]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setItems([emptyItem()]);
    }
  }, [state.success]);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor="title">Título da proposta</Label>
          <Input id="title" name="title" placeholder="Ex.: Proposta de gestão de tráfego mensal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil">Validade</Label>
          <Input id="validUntil" name="validUntil" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Itens</p>
            <p className="text-xs text-muted-foreground">
              Monte a proposta com quantidade e valor unitário.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setItems((current) => [...current, emptyItem()])}
          >
            Adicionar item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1.5fr_0.5fr_0.7fr_auto]">
              <Input
                value={item.description}
                placeholder="Descrição do item"
                onChange={(event) =>
                  setItems((current) =>
                    current.map((currentItem, currentIndex) =>
                      currentIndex === index
                        ? { ...currentItem, description: event.target.value }
                        : currentItem,
                    ),
                  )
                }
              />
              <Input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                placeholder="Qtd"
                onChange={(event) =>
                  setItems((current) =>
                    current.map((currentItem, currentIndex) =>
                      currentIndex === index
                        ? {
                            ...currentItem,
                            quantity: Math.max(1, Number(event.target.value || 1)),
                          }
                        : currentItem,
                    ),
                  )
                }
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                placeholder="Valor unit."
                onChange={(event) =>
                  setItems((current) =>
                    current.map((currentItem, currentIndex) =>
                      currentIndex === index
                        ? {
                            ...currentItem,
                            unitPrice: Math.max(0, Number(event.target.value || 0)),
                          }
                        : currentItem,
                    ),
                  )
                }
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setItems((current) =>
                    current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
              >
                Remover
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <p className="text-sm font-medium text-foreground">
            Total:{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(total)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Escopo, forma de pagamento, prazo de implantação e demais condições."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Criando..." : "Criar proposta"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
