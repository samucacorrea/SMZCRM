import { redirect } from "next/navigation";

import { MfaSetupForm } from "@/components/auth/mfa-setup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/session";

export default async function MfaSetupPage() {
  const session = await getServerSession();

  if (session?.user.twoFactorEnabled) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>MFA obrigatório</CardTitle>
          <CardDescription>
            Admins precisam ativar TOTP antes de acessar o restante da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
