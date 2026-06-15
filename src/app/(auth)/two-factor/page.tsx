import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TwoFactorPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verificação em duas etapas</CardTitle>
        <CardDescription>
          Informe o código TOTP gerado no autenticador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TwoFactorForm />
      </CardContent>
    </Card>
  );
}
