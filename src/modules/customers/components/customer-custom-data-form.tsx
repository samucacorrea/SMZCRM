"use client";

import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CustomerActionState,
  updateCustomerCustomDataAction,
} from "@/modules/customers/actions";

const initialState: CustomerActionState = {};

type CustomerCustomField = {
  id: string;
  key: string;
  label: string;
  dataType: "text" | "number" | "date" | "boolean";
  isRequired: boolean;
};

function getFieldName(fieldKey: string) {
  return `custom:${fieldKey}`;
}

export function CustomerCustomDataForm({
  customerId,
  customFields,
  customData,
}: {
  customerId: string;
  customFields: CustomerCustomField[];
  customData: Record<string, unknown>;
}) {
  const action = useMemo(
    () => updateCustomerCustomDataAction.bind(null, customerId),
    [customerId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {customFields.map((field) => {
          const value = customData[field.key];

          if (field.dataType === "boolean") {
            return (
              <label
                key={field.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  name={getFieldName(field.key)}
                  defaultChecked={Boolean(value)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary"
                />
                <span className="space-y-1">
                  <span className="block font-medium text-foreground">{field.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    Campo booleano
                  </span>
                </span>
              </label>
            );
          }

          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                name={getFieldName(field.key)}
                type={field.dataType === "number" ? "number" : field.dataType === "date" ? "date" : "text"}
                defaultValue={typeof value === "string" || typeof value === "number" ? String(value) : ""}
                placeholder={field.dataType === "date" ? "Selecione uma data" : "Preencha o valor"}
              />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar campos extras"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
