"use client";

import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  type CustomerActionState,
  updateCustomerContactAccessAction,
} from "@/modules/customers/actions";
import { customerPortalPermissionLabels, customerPortalPermissionValues } from "@/modules/customers/validators";

const initialState: CustomerActionState = {};

type CustomerContactAccessFormProps = {
  contact: {
    id: string;
    customerId: string;
    isPrimary: boolean;
    portalPermissions: string[];
  };
};

export function CustomerContactAccessForm({ contact }: CustomerContactAccessFormProps) {
  const action = useMemo(
    () => updateCustomerContactAccessAction.bind(null, contact.id),
    [contact.id],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border bg-card p-3">
      <input name="customerId" type="hidden" value={contact.customerId} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Portal do cliente
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {customerPortalPermissionValues.map((permission) => (
            <label key={permission} className="flex items-center gap-2 text-sm text-foreground">
              <input
                defaultChecked={contact.portalPermissions.includes(permission)}
                name="portalPermissions"
                type="checkbox"
                value={permission}
              />
              <span>{customerPortalPermissionLabels[permission]}</span>
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input defaultChecked={contact.isPrimary} name="isPrimary" type="checkbox" />
        <span>Contato principal</span>
      </label>
      <div className="flex items-center gap-3">
        <Button disabled={isPending} size="sm" type="submit" variant="outline">
          {isPending ? "Atualizando..." : "Salvar acesso"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
