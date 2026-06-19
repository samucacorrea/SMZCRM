"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptProposalByTokenAction,
  type PublicProposalActionState,
} from "@/modules/proposals/actions";

const initialState: PublicProposalActionState = {};

export function PublicProposalAcceptForm({
  publicToken,
  disabled,
}: {
  publicToken: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const action = useMemo(
    () => acceptProposalByTokenAction.bind(null, publicToken),
    [publicToken],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="signerName">Nome de quem aceita</Label>
        <Input
          id="signerName"
          name="signerName"
          placeholder="Nome completo"
          disabled={disabled || isPending}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? "Registrando..." : "Aceitar proposta"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
