import { notFound } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { listLeadStagesByTenant } from "@/modules/leads/queries";
import { flattenPayload } from "@/modules/webhooks/payload";
import { WebhookCustomFieldCreateForm } from "@/modules/webhooks/components/webhook-custom-field-create-form";
import { WebhookMappingCreateForm } from "@/modules/webhooks/components/webhook-mapping-create-form";
import { WebhookMappingDeleteButton } from "@/modules/webhooks/components/webhook-mapping-delete-button";
import { WebhookPayloadTestForm } from "@/modules/webhooks/components/webhook-payload-test-form";
import { WebhookReplayButton } from "@/modules/webhooks/components/webhook-replay-button";
import { WebhookSecretRotateForm } from "@/modules/webhooks/components/webhook-secret-rotate-form";
import { WebhookSettingsForm } from "@/modules/webhooks/components/webhook-settings-form";
import {
  getInboundWebhookById,
  listLeadCustomFieldsByTenant,
  listStaffMembersByTenant,
} from "@/modules/webhooks/queries";

export async function WebhookDetailPageView({ webhookId }: { webhookId: string }) {
  await assertPermission("webhooks", "view");
  const tenantContext = await getTenantContext();
  const [webhook, customFields, stages, staffMembers] = await Promise.all([
    getInboundWebhookById(tenantContext.tenantId, webhookId),
    listLeadCustomFieldsByTenant(tenantContext.tenantId),
    listLeadStagesByTenant(tenantContext.tenantId),
    listStaffMembersByTenant(tenantContext.tenantId),
  ]);

  if (!webhook) {
    notFound();
  }

  const endpointUrl = `${env.NEXT_PUBLIC_APP_URL}/api/in/${tenantContext.tenantId}/${webhook.id}`;
  const latestLog = webhook.requestLogs[0] ?? null;
  const flattenedPayload = latestLog ? flattenPayload(latestLog.rawPayload) : {};
  const mappedSources = new Set(webhook.mappings.map((mapping) => mapping.sourceField));
  const suggestedFields = Object.keys(flattenedPayload).filter((field) => !mappedSources.has(field));
  const curlExample = [
    `curl -X POST "${endpointUrl}"`,
    `  -H "Authorization: Bearer SEU_TOKEN_SECRETO"`,
    `  -H "Content-Type: application/json"`,
    `  -d '{"name":"Mariana Costa","email":"mariana@empresa.com.br","phone":"11999887766"}'`,
  ].join(" \\\n");

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          CRM / Webhooks / Detalhe
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            {webhook.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status {webhook.status} · estágio {webhook.defaultStage?.name || "não definido"}
          </p>
        </div>
        <div className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-primary">
          <div className="flex items-center gap-3">
            <span>{webhook.requestLogs.length} captura(s)</span>
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link href={`/webhooks/${webhook.id}/docs`}>Documentação</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Logs</p>
          <p className="text-lg font-semibold text-foreground">{webhook.requestLogs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Mappings</p>
          <p className="text-lg font-semibold text-foreground">{webhook.mappings.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Dedup</p>
          <p className="text-lg font-semibold text-foreground">{webhook.dedupKey}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Extras</p>
          <p className="text-lg font-semibold text-foreground">{webhook.unmappedPolicy}</p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>
              Regras principais de ingestão, atribuição e tratamento de campos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Origem padrão: {webhook.defaultSource || "Não definida"}</p>
              <p>Dono padrão: {webhook.defaultOwner?.displayName || "Sem dono"}</p>
              <p>Dedup: {webhook.dedupKey}</p>
              <p>Ação: {webhook.dedupAction}</p>
              <p>Etiquetas: {webhook.autoTags.length ? webhook.autoTags.join(", ") : "Nenhuma"}</p>
              <p>Unmapped: {webhook.unmappedPolicy}</p>
              <p className="sm:col-span-2 break-all">Endpoint: {endpointUrl}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Editar configuração
              </p>
              <div className="mt-3">
                <WebhookSettingsForm
                  webhook={{
                    id: webhook.id,
                    name: webhook.name,
                    defaultStageId: webhook.defaultStageId,
                    defaultSource: webhook.defaultSource,
                    defaultOwnerId: webhook.defaultOwnerId,
                    autoTags: webhook.autoTags,
                    dedupKey: webhook.dedupKey,
                    dedupAction: webhook.dedupAction,
                    unmappedPolicy: webhook.unmappedPolicy,
                    status: webhook.status,
                    validation: webhook.validation,
                  }}
                  stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))}
                  staffMembers={staffMembers.map((member) => ({
                    id: member.id,
                    displayName: member.displayName,
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardHeader>
            <CardTitle>Documentação automática</CardTitle>
            <CardDescription>
              URL, header esperado, exemplo de envio e rotação segura do segredo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <p className="font-medium text-foreground">Como autenticar</p>
              <p className="mt-2 text-muted-foreground">
                Envie `Authorization: Bearer SEU_TOKEN_SECRETO` ou `x-webhook-token`.
              </p>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{curlExample}</code>
            </pre>
            <WebhookSecretRotateForm webhookId={webhook.id} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Mapeamento em 2 colunas</CardTitle>
            <CardDescription>
              Campos do payload à esquerda; destino no CRM, atribuição ou extras à direita.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {webhook.mappings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum mapeamento configurado.</p>
            ) : (
              webhook.mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-[1fr_auto_1fr]"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Campo recebido
                    </p>
                    <p className="mt-1 font-medium text-foreground">{mapping.sourceField}</p>
                  </div>
                  <div className="flex items-center justify-center text-xs font-medium text-muted-foreground">
                    →
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Destino
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {mapping.targetType} / {mapping.targetKey}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Transformação:{" "}
                      {Object.keys(mapping.transform).length
                        ? JSON.stringify(mapping.transform)
                        : "nenhuma"}
                    </p>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <WebhookMappingDeleteButton webhookId={webhook.id} mappingId={mapping.id} />
                  </div>
                </div>
              ))
            )}
            <div className="rounded-xl border border-dashed border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Sugestões automáticas
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {suggestedFields.length
                  ? suggestedFields.join(", ")
                  : "Nenhum campo novo apareceu no ultimo payload capturado."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Novo mapeamento
              </p>
              <div className="mt-3">
                <WebhookMappingCreateForm
                  webhookId={webhook.id}
                  customFields={customFields.map((field) => ({
                    key: field.key,
                    label: field.label,
                  }))}
                />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Criar campo na hora
              </p>
              <div className="mt-3">
                <WebhookCustomFieldCreateForm webhookId={webhook.id} />
              </div>
              {customFields.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {customFields.map((field) => (
                    <span
                      key={field.id}
                      className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-primary"
                    >
                      {field.label} · {field.key}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Modo escuta</CardTitle>
            <CardDescription>
              Envie um payload de teste para o endpoint ou use o simulador interno.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WebhookPayloadTestForm webhookId={webhook.id} />
            {latestLog ? (
              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">Último payload capturado</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(latestLog.createdAt)}
                  </p>
                </div>
                <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-border bg-card p-3">
                  {Object.entries(flattenedPayload).map(([key, value]) => (
                    <div
                      key={key}
                      className="grid gap-2 border-b border-border/70 pb-2 text-sm last:border-b-0 last:pb-0 md:grid-cols-[0.9fr_1.1fr]"
                    >
                      <span className="font-medium text-foreground">{key}</span>
                      <span className="break-all text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum payload capturado ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos logs</CardTitle>
          <CardDescription>
            Base para reprocessamento e diagnóstico de payload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhook.requestLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma requisição recebida ainda.</p>
          ) : (
            webhook.requestLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-border bg-background p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{log.result}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(log.createdAt)}
                    </p>
                  </div>
                  <WebhookReplayButton webhookId={webhook.id} logId={log.id} />
                </div>
                <p className="mt-2 text-muted-foreground">
                  {log.reason || "Processado sem erro explícito."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {log.leadId ? (
                    <Link href={`/leads/${log.leadId}`} className="font-medium text-primary">
                      Abrir lead
                    </Link>
                  ) : null}
                  {log.eventId ? <span>event_id: {log.eventId}</span> : null}
                  {log.ipAddress ? <span>IP: {log.ipAddress}</span> : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
