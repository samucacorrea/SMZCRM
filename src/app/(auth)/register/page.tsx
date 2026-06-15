import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Cadastro inicial com e-mail/senha, pronto para MFA e tenancy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegisterForm />
        <p className="text-sm text-muted-foreground">
          Já tem acesso?{" "}
          <Link className="font-medium text-primary" href="/login">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
