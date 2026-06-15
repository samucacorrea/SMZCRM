"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  importLeadsCsvAction,
  type LeadImportActionState,
} from "@/modules/leads/actions";

const initialState: LeadImportActionState = {};

export function LeadImportForm() {
  const [state, formAction, isPending] = useActionState(
    importLeadsCsvAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input
        accept=".csv,text/csv"
        className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        name="file"
        type="file"
      />
      <p className="text-xs text-muted-foreground">
        Colunas: name, company, email, phone, source, stageName, estimatedValue, tags,
        description
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Importando..." : "Importar CSV"}
        </Button>
        {state.created !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {state.created} criados, {state.failed ?? 0} falhas
          </p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      {state.errors?.length ? (
        <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </form>
  );
}
