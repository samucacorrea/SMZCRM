import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { listLeadsByTenant, listLeadStagesByTenant } from "@/modules/leads/queries";

export async function LeadsListPageView({
  searchParams,
}: {
  searchParams: { q?: string; stage?: string };
}) {
  await assertPermission("leads", "view");
  const tenantContext = await getTenantContext();
  const [stages, leads] = await Promise.all([
    listLeadStagesByTenant(tenantContext.tenantId),
    listLeadsByTenant(tenantContext.tenantId, {
      query: searchParams.q,
      stageId: searchParams.stage,
    }),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Leads / Lista
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A listagem fica separada do cadastro e do kanban.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-11 px-5" variant="outline">
            <Link href="/leads/kanban">Abrir kanban</Link>
          </Button>
          <Button asChild className="h-11 px-5">
            <Link href="/leads/new">Adicionar lead</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Leads
          </p>
          <p className="text-lg font-semibold text-foreground">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Estágios
          </p>
          <p className="text-lg font-semibold text-foreground">{stages.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Pipeline
          </p>
          <p className="text-lg font-semibold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(leads.reduce((total, lead) => total + lead.estimatedValueInCents, 0) / 100)}
          </p>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Listagem de leads</CardTitle>
          <CardDescription>
            Busca e filtros densos em uma tela separada do quadro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input
              defaultValue={searchParams.q ?? ""}
              name="q"
              placeholder="Buscar por nome, empresa, origem ou e-mail"
              className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
            />
            <select
              defaultValue={searchParams.stage ?? ""}
              name="stage"
              className="flex h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="">Todos os estágios</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Filtrar
            </button>
          </form>

          {leads.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum lead encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-background text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Estágio</th>
                    <th className="px-4 py-3 font-medium">Origem</th>
                    <th className="px-4 py-3 font-medium">Responsável</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`} className="font-medium text-foreground">
                          {lead.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {lead.company || "Sem empresa"} · {lead.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">{lead.stage.name}</td>
                      <td className="px-4 py-3">{lead.source}</td>
                      <td className="px-4 py-3">{lead.assignee?.displayName || "Sem dono"}</td>
                      <td className="px-4 py-3">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(lead.estimatedValueInCents / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
