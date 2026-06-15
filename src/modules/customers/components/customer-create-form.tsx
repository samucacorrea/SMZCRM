"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCustomerAction,
  type CustomerActionState,
} from "@/modules/customers/actions";

const initialState: CustomerActionState = {};

export function CustomerCreateForm() {
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="legalName">Razão social</Label>
        <Input id="legalName" name="legalName" placeholder="Acme LTDA" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tradeName">Nome fantasia</Label>
        <Input id="tradeName" name="tradeName" placeholder="Acme" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxId">CPF/CNPJ</Label>
        <Input id="taxId" name="taxId" placeholder="00.000.000/0001-00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactName">Contato principal</Label>
        <Input id="contactName" name="contactName" placeholder="Maria Silva" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="contato@empresa.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Site</Label>
        <Input id="website" name="website" placeholder="https://empresa.com.br" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" placeholder="São Paulo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF</Label>
          <Input id="state" name="state" maxLength={2} placeholder="SP" />
        </div>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar cliente"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
