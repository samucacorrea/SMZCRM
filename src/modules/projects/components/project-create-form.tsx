"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction, type ProjectActionState } from "@/modules/projects/actions";

const initialState: ProjectActionState = {};

export function ProjectCreateForm({
  customers,
  defaultCustomerId,
}: {
  customers: Array<{ id: string; legalName: string; tradeName: string | null }>;
  defaultCustomerId?: string;
}) {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
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
        <Label htmlFor="name">Nome do projeto</Label>
        <Input id="name" name="name" placeholder="Gestão de Tráfego, Implantação CRM, Website..." />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={3} placeholder="Escopo, entregas e contexto." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billingType">Faturamento</Label>
        <select
          id="billingType"
          name="billingType"
          defaultValue="fixed"
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="fixed">Valor fixo</option>
          <option value="project_hour">Hora de projeto</option>
          <option value="task_hour">Hora de tarefa</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue="planning"
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="planning">Planejamento</option>
          <option value="active">Ativo</option>
          <option value="on_hold">Em pausa</option>
          <option value="completed">Concluído</option>
          <option value="canceled">Cancelado</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="health">Saúde</Label>
        <select
          id="health"
          name="health"
          defaultValue="healthy"
          className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="healthy">Saudável</option>
          <option value="attention">Atenção</option>
          <option value="critical">Crítico</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Moeda</Label>
        <Input id="currency" name="currency" defaultValue="BRL" maxLength={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rate">Valor hora</Label>
        <Input id="rate" name="rate" type="number" min="0" step="0.01" defaultValue="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Orçamento</Label>
        <Input id="budget" name="budget" type="number" min="0" step="0.01" defaultValue="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="progress">Progresso</Label>
        <Input id="progress" name="progress" type="number" min="0" max="100" defaultValue="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startDate">Início</Label>
        <Input id="startDate" name="startDate" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Prazo</Label>
        <Input id="dueDate" name="dueDate" type="datetime-local" />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Criando..." : "Criar projeto"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
