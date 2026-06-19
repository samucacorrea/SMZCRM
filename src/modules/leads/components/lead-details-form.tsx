"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadDetailsAction, type LeadActionState } from "@/modules/leads/actions";

const initialState: LeadActionState = {};

export function LeadDetailsForm({
  lead,
}: {
  lead: {
    id: string;
    name: string;
    company: string | null;
    email: string;
    phone: string | null;
    source: string;
    estimatedValueInCents: number;
    tags: string[];
    description: string | null;
  };
}) {
  const router = useRouter();
  const action = useMemo(() => updateLeadDetailsAction.bind(null, lead.id), [lead.id]);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={lead.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <Input id="company" name="company" defaultValue={lead.company ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={lead.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" defaultValue={lead.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">Origem</Label>
        <Input id="source" name="source" defaultValue={lead.source} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="estimatedValue">Valor estimado</Label>
        <Input
          id="estimatedValue"
          name="estimatedValue"
          type="number"
          min="0"
          step="0.01"
          defaultValue={(lead.estimatedValueInCents / 100).toFixed(2)}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="tags">Etiquetas</Label>
        <Input id="tags" name="tags" defaultValue={lead.tags.join(", ")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={lead.description ?? ""}
          placeholder="Contexto, dor principal, objections e próximos passos."
          rows={4}
        />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
