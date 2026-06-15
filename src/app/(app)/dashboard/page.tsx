import { getTenantContext } from "@/lib/tenant-context";
import { assertPermission } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  "Docker multi-serviço com app, worker, PostgreSQL, Redis e MinIO.",
  "Auth Better Auth com e-mail/senha, Google e MFA/TOTP.",
  "RLS por `app.current_tenant_id` e repositório tenant-aware no Drizzle.",
  "RBAC server-first com papéis e permissões por módulo.",
];

export default async function DashboardPage() {
  await assertPermission("crm", "view");
  const tenantContext = await getTenantContext();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>FASE 0</CardTitle>
          <CardDescription>
            Base autenticada e multi-tenant pronta para receber módulos de negócio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {pillars.map((pillar) => (
            <p key={pillar}>{pillar}</p>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Próximos blocos</CardTitle>
          <CardDescription>
            Leads, faturas e demais features entram sobre esta fundação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Tenant demo</p>
          <p>Usuário admin seed</p>
          <p>Suíte cross-tenant preparada</p>
          <p>Tenant ativo: {tenantContext.tenantId}</p>
        </CardContent>
      </Card>
    </div>
  );
}
