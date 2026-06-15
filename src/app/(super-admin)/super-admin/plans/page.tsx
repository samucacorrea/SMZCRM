import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";

export default async function SuperAdminPlansPage() {
  await requireSuperAdminSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Base pronta para Starter, Pro e Business.
      </CardContent>
    </Card>
  );
}
