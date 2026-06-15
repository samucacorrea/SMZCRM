import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";

export default async function SuperAdminDashboardPage() {
  const { user } = await requireSuperAdminSession();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Controle global</CardTitle>
          <CardDescription>Área reservada ao operador do SaaS.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Usuário atual: {user.email}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>MFA obrigatório para acesso administrativo.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Guard separado de tenant.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Operação</CardTitle>
          <CardDescription>Base para tenants, planos e monitoramento.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Pronto para expandir nas próximas fases.</p>
        </CardContent>
      </Card>
    </div>
  );
}
