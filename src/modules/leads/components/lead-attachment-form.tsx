"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLeadAttachmentAction, type LeadActionState } from "@/modules/leads/actions";

const initialState: LeadActionState = {};

export function LeadAttachmentForm({ leadId }: { leadId: string }) {
  const action = useMemo(() => createLeadAttachmentAction.bind(null, leadId), [leadId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="file">Novo anexo</Label>
        <Input id="file" name="file" type="file" />
        <p className="text-xs text-muted-foreground">
          Limite de 10 MB. Arquivos ficam armazenados no bucket privado do tenant.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar anexo"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
