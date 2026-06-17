"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCustomerContactAction,
  type CustomerActionState,
} from "@/modules/customers/actions";
import { customerPortalPermissionLabels, customerPortalPermissionValues } from "@/modules/customers/validators";

const initialState: CustomerActionState = {};

export function CustomerContactForm({ customerId }: { customerId: string }) {
  const action = useMemo(
    () => createCustomerContactAction.bind(null, customerId),
    [customerId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" placeholder="Ana Souza" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Cargo</Label>
          <Input id="jobTitle" name="jobTitle" placeholder="Compras" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="ana@empresa.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Permissões do portal</Label>
          <div className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-2">
            {customerPortalPermissionValues.map((permission) => (
              <label key={permission} className="flex items-center gap-2 text-sm text-foreground">
                <input name="portalPermissions" type="checkbox" value={permission} />
                <span>{customerPortalPermissionLabels[permission]}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input name="isPrimary" type="checkbox" />
            <span>Definir como contato principal</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Adicionar contato"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
