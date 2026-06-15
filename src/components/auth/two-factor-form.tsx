"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  code: z.string().length(6),
});

type FormValues = z.infer<typeof formSchema>;

export function TwoFactorForm() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await authClient.twoFactor.verifyTotp(values);

    if (result.error) {
      form.setError("root", { message: result.error.message });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="code">Código do autenticador</Label>
        <Input
          id="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          {...form.register("code")}
        />
      </div>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
      ) : null}
      <Button className="w-full" type="submit">
        Verificar MFA
      </Button>
    </form>
  );
}
