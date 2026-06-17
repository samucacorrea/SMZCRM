import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { LeadConvertButton } from "@/modules/leads/components/lead-convert-button";
import { LeadNoteForm } from "@/modules/leads/components/lead-note-form";
import { LeadQualificationPanel } from "@/modules/leads/components/lead-qualification-panel";
import { LeadStagePicker } from "@/modules/leads/components/lead-stage-picker";
import { getLeadById, listLeadStagesByTenant } from "@/modules/leads/queries";

const tabs = [
  "Resumo",
  "Atividades",
  "Tarefas",
  "Lembretes",
  "Anexos",
  "Propostas",
  "Follow-ups",
];

function formatAttributionLabel(key: string) {
  const labels: Record<string, string> = {
    utmSource: "UTM Source",
    utmMedium: "UTM Medium",
    utmCampaign: "UTM Campaign",
    utmTerm: "UTM Term",
    utmContent: "UTM Content",
    gclid: "GCLID",
    fbclid: "FBCLID",
    fbp: "FBP",
    fbc: "FBC",
    ttclid: "TTCLID",
    ctwaClid: "CTWA",
    referral: "Referral",
    pageUrl: "Página",
    referrer: "Referrer",
  };

  return labels[key] ?? key;
}

export async function LeadProfilePageView({ leadId }: { leadId: string }) {
  await assertPermission("leads", "view");
  const tenantContext = await getTenantContext();
  const [lead, stages] = await Promise.all([
    getLeadById(tenantContext.tenantId, leadId),
    listLeadStagesByTenant(tenantContext.tenantId),
  ]);

  if (!lead) {
    notFound();
  }

  const attribution = lead.attribution[0] ?? null;
  const attributionEntries = attribution
    ? Object.entries({
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        utmTerm: attribution.utmTerm,
        utmContent: attribution.utmContent,
        gclid: attribution.gclid,
        fbclid: attribution.fbclid,
        fbp: attribution.fbp,
        fbc: attribution.fbc,
        ttclid: attribution.ttclid,
        ctwaClid: attribution.ctwaClid,
        referral: attribution.referral,
        pageUrl: attribution.pageUrl,
        referrer: attribution.referrer,
      }).filter(([, value]) => Boolean(value))
    : [];
  const webhookExtraEntries = Object.entries(attribution?.extraData ?? {});
  const latestWebhookLog = lead.webhookLogs[0] ?? null;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Leads / Perfil
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            {lead.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.company || "Sem empresa"} · {lead.email}
          </p>
        </div>
        <div className="flex min-w-[260px] flex-col gap-3">
          <LeadStagePicker
            leadId={lead.id}
            currentStageId={lead.stageId}
            stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))}
          />
          <LeadConvertButton
            leadId={lead.id}
            convertedCustomerId={lead.convertedCustomerId}
          />
          {lead.convertedCustomerId ? (
            <Link
              href={`/customers/${lead.convertedCustomerId}`}
              className="text-sm font-medium text-primary"
            >
              Abrir cliente convertido
            </Link>
          ) : null}
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap gap-2 p-4">
          {tabs.map((tab, index) => (
            <span
              key={tab}
              className={`rounded-full px-3 py-1 text-sm ${
                index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {tab}
            </span>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <p>Estágio atual: {lead.stage.name}</p>
            <p>Origem: {lead.source}</p>
            <p>
              Qualificação:{" "}
              {lead.qualification === "qualified"
                ? "Qualificado"
                : lead.qualification === "won"
                  ? "Ganho"
                  : lead.qualification === "lost"
                    ? "Perdido"
                    : "Em aberto"}
            </p>
            <p>Telefone: {lead.phone || "Não informado"}</p>
            <p>
              Valor estimado:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(lead.estimatedValueInCents / 100)}
            </p>
            <p>
              Valor fechado:{" "}
              {lead.saleValueInCents
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: lead.saleCurrency || "BRL",
                  }).format(lead.saleValueInCents / 100)
                : "Nao informado"}
            </p>
            <p>Responsável: {lead.assignee?.displayName || "Sem dono"}</p>
            <p>Etiquetas: {lead.tags.length ? lead.tags.join(", ") : "Nenhuma"}</p>
            <p>Motivo de perda: {lead.lostReason || "Nao informado"}</p>
            <p className="sm:col-span-2">Descrição: {lead.description || "Sem descrição"}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
            <CardDescription>Timeline do relacionamento comercial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LeadNoteForm leadId={lead.id} />
            {lead.activities.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada.
              </p>
            ) : (
              lead.activities.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{activity.actor?.displayName || "Sistema"}</span>
                    <span>
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {activity.type}
                  </p>
                  <p className="mt-2 text-sm text-foreground">{activity.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1 bg-primary/70" />
        <CardHeader>
          <CardTitle>Qualificação e fechamento</CardTitle>
          <CardDescription>
            Controle do avanço comercial e registro de venda fechada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadQualificationPanel
            leadId={lead.id}
            qualification={lead.qualification}
            saleCurrency={lead.saleCurrency}
            lostReason={lead.lostReason}
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Atribuição</CardTitle>
            <CardDescription>
              Origem da conversão e identificadores capturados no ponto de entrada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Entry Point
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {attribution?.entryPoint || "Não capturado"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Último webhook
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {latestWebhookLog
                    ? new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(latestWebhookLog.createdAt)
                    : "Sem captura"}
                </p>
              </div>
            </div>

            {attributionEntries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum dado de atribuição registrado.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {attributionEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {formatAttributionLabel(key)}
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-foreground">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardHeader>
            <CardTitle>Payload Recebido</CardTitle>
            <CardDescription>
              Campos personalizados mapeados e extras armazenados pelo webhook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Campos personalizados
              </p>
              {Object.keys(lead.customData ?? {}).length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  Nenhum valor registrado.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(lead.customData ?? {}).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-primary"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Dados extras
              </p>
              {webhookExtraEntries.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  Nenhum dado extra registrado.
                </p>
              ) : (
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-background p-4">
                  {webhookExtraEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="grid gap-2 border-b border-border/70 pb-2 text-sm last:border-b-0 last:pb-0 md:grid-cols-[0.9fr_1.1fr]"
                    >
                      <span className="font-medium text-foreground">{key}</span>
                      <span className="break-all text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
