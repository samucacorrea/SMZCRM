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
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await authClient.signIn.email(
      {
        ...values,
        callbackURL: redirectTo,
      },
      {
        onSuccess(context) {
          if (context.data?.twoFactorRedirect) {
            router.push("/two-factor");
            return;
          }

          router.push(redirectTo);
          router.refresh();
        },
      },
    );

    if (result.error) {
      form.setError("root", {
        message: result.error.message,
      });
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" {...form.register("password")} />
      </div>

      {form.formState.errors.root?.message ? (
        <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
      ) : null}

      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        Entrar
      </Button>

      <Button
        className="w-full"
        type="button"
        variant="outline"
        onClick={() =>
          authClient.signIn.social({ provider: "google", callbackURL: redirectTo })
        }
      >
        Entrar com Google
      </Button>
    </form>
  );
}
