import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";

export default async function SuperAdminTenantsPage() {
  await requireSuperAdminSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Cadastro operacional pronto para a próxima fase.
      </CardContent>
    </Card>
  );
}
