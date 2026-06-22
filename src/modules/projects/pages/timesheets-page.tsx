import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { TimesheetsPanel } from "@/modules/projects/components/timesheets-panel";
import {
  listProjectActiveTimersByTenant,
  listProjectOwnersByTenant,
  listProjectsByTenant,
  listProjectTimeEntriesByTenant,
} from "@/modules/projects/queries";

export async function TimesheetsPageView({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await assertPermission("crm", "view");
  const tenantContext = await getTenantContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const projectId =
    typeof resolvedSearchParams.projectId === "string" && resolvedSearchParams.projectId.length > 0
      ? resolvedSearchParams.projectId
      : undefined;
  const staffId =
    typeof resolvedSearchParams.staffId === "string" && resolvedSearchParams.staffId.length > 0
      ? resolvedSearchParams.staffId
      : undefined;
  const billable =
    resolvedSearchParams.billable === "true" || resolvedSearchParams.billable === "false"
      ? resolvedSearchParams.billable
      : "all";

  const [projects, staffMembers, entries, activeTimers] = await Promise.all([
    listProjectsByTenant(tenantContext.tenantId),
    listProjectOwnersByTenant(tenantContext.tenantId),
    listProjectTimeEntriesByTenant(tenantContext.tenantId, {
      projectId,
      staffId,
      billable: billable === "all" ? undefined : billable === "true",
    }),
    listProjectActiveTimersByTenant(tenantContext.tenantId, {
      projectId,
      staffId,
    }),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Operação / Timesheets
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Timesheets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada de esforço, timers em andamento e pendência de faturamento.
          </p>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Painel operacional</CardTitle>
          <CardDescription>
            Filtre por projeto ou responsável para acompanhar execução e cobrança em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimesheetsPanel
            filters={{ projectId, staffId, billable }}
            projects={projects.map((project) => ({
              id: project.id,
              label: project.name,
            }))}
            staffMembers={staffMembers.map((member) => ({
              id: member.id,
              label: member.displayName,
            }))}
            entries={entries}
            activeTimers={activeTimers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
