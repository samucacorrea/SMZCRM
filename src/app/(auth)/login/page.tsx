import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const redirectValue = params.redirectTo;
  const redirectTo =
    typeof redirectValue === "string" ? redirectValue : "/dashboard";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Sessões por cookie, MFA via TOTP e isolamento por tenant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm redirectTo={redirectTo} />
        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link className="font-medium text-primary" href="/register">
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
