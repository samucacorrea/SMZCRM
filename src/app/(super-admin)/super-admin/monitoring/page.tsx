import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";

export default async function SuperAdminMonitoringPage() {
  await requireSuperAdminSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoramento</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Reservado para saúde da aplicação, filas e integrações.
      </CardContent>
    </Card>
  );
}
