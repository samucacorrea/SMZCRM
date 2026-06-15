import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { listLeadStagesByTenant } from "@/modules/leads/queries";
import { InboundWebhookCreateForm } from "@/modules/webhooks/components/inbound-webhook-create-form";
import { listInboundWebhooksByTenant } from "@/modules/webhooks/queries";

export async function WebhooksPageView() {
  await assertPermission("webhooks", "view");
  const tenantContext = await getTenantContext();
  const [webhooks, stages] = await Promise.all([
    listInboundWebhooksByTenant(tenantContext.tenantId),
    listLeadStagesByTenant(tenantContext.tenantId),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Webhooks
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Webhooks de entrada
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Canal principal de captação com token secreto, estágio padrão, teste interno e replay.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Webhooks
          </p>
          <p className="text-lg font-semibold text-foreground">{webhooks.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Estágios
          </p>
          <p className="text-lg font-semibold text-foreground">{stages.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Ativos
          </p>
          <p className="text-lg font-semibold text-foreground">
            {webhooks.filter((webhook) => webhook.status === "active").length}
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Novo webhook</CardTitle>
            <CardDescription>
              Gera URL pública, token, deduplicação e mappings iniciais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InboundWebhookCreateForm
              stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardHeader>
            <CardTitle>Operação</CardTitle>
            <CardDescription>
              Cada webhook recebe e processa leads externos com logs completos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Configure estágio inicial, origem e deduplicação.</p>
            <p>2. Entregue URL + token ao sistema externo.</p>
            <p>3. Use a tela de detalhe para revisar mappings e últimas requisições.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks ativos</CardTitle>
          <CardDescription>{webhooks.length} webhook(s) neste tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhooks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum webhook cadastrado ainda.
            </p>
          ) : (
            webhooks.map((webhook) => (
              <Link
                key={webhook.id}
                href={`/webhooks/${webhook.id}`}
                className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{webhook.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {webhook.defaultStage?.name || "Sem estágio"} ·{" "}
                      {webhook.defaultSource || "Sem origem"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Dedup {webhook.dedupKey} / {webhook.dedupAction}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-2 py-1 text-[11px] text-accent-foreground">
                    {webhook.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
