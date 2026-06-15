"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const enableSchema = z.object({
  password: z.string().min(8),
});

const verifySchema = z.object({
  code: z.string().length(6),
});

type EnableValues = z.infer<typeof enableSchema>;
type VerifyValues = z.infer<typeof verifySchema>;

export function MfaSetupForm() {
  const router = useRouter();
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const enableForm = useForm<EnableValues>({
    resolver: zodResolver(enableSchema),
    defaultValues: {
      password: "",
    },
  });

  const verifyForm = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  const handleEnable = enableForm.handleSubmit(async (values) => {
    const result = await authClient.twoFactor.enable({
      password: values.password,
      issuer: "NucleoCRM",
    });

    if (result.error) {
      enableForm.setError("root", { message: result.error.message });
      return;
    }

    setTotpUri(result.data?.totpURI ?? null);
    setBackupCodes(result.data?.backupCodes ?? []);
    verifyForm.reset();
  });

  const handleVerify = verifyForm.handleSubmit(async (values) => {
    const result = await authClient.twoFactor.verifyTotp(values);

    if (result.error) {
      verifyForm.setError("root", { message: result.error.message });
      return;
    }

    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  });

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleEnable}>
        <div className="space-y-2">
          <Label htmlFor="enable-password">Confirme sua senha</Label>
          <Input
            id="enable-password"
            type="password"
            {...enableForm.register("password")}
          />
        </div>
        {enableForm.formState.errors.root?.message ? (
          <p className="text-sm text-red-600">
            {enableForm.formState.errors.root.message}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Gerar segredo MFA
        </Button>
      </form>

      {totpUri ? (
        <div className="space-y-6 rounded-lg border border-border bg-background/60 p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">URI TOTP</p>
            <p className="break-all rounded-lg bg-card p-3 text-xs text-muted-foreground">
              {totpUri}
            </p>
            <p className="text-xs text-muted-foreground">
              Use essa URI no autenticador caso você não queira escanear QR Code.
            </p>
          </div>

          {backupCodes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Backup codes</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {backupCodes.map((code) => (
                  <p key={code} className="rounded-lg bg-card p-3 font-mono text-xs">
                    {code}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleVerify}>
            <div className="space-y-2">
              <Label htmlFor="verify-code">Código do autenticador</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                {...verifyForm.register("code")}
              />
            </div>
            {verifyForm.formState.errors.root?.message ? (
              <p className="text-sm text-red-600">
                {verifyForm.formState.errors.root.message}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Ativar MFA
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
