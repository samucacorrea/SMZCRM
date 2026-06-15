import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { getInboundWebhookById } from "@/modules/webhooks/queries";

export async function WebhookDocsPageView({ webhookId }: { webhookId: string }) {
  await assertPermission("webhooks", "view");
  const tenantContext = await getTenantContext();
  const webhook = await getInboundWebhookById(tenantContext.tenantId, webhookId);

  if (!webhook) {
    notFound();
  }

  const endpointUrl = `${env.NEXT_PUBLIC_APP_URL}/api/in/${tenantContext.tenantId}/${webhook.id}`;
  const curlExample = [
    `curl -X POST "${endpointUrl}"`,
    `  -H "Authorization: Bearer SEU_TOKEN_SECRETO"`,
    `  -H "Content-Type: application/json"`,
    `  -d '{"name":"Mariana Costa","email":"mariana@empresa.com.br","phone":"11999887766","utm_source":"meta","utm_campaign":"black-friday"}'`,
  ].join(" \\\n");
  const jsonExample = `{
  "name": "Mariana Costa",
  "email": "mariana@empresa.com.br",
  "phone": "11999887766",
  "source": "Landing Page",
  "utm_source": "meta",
  "utm_medium": "cpc",
  "utm_campaign": "black-friday",
  "utm_content": "criativo-a",
  "page_url": "https://cliente.com.br/landing",
  "referrer": "https://instagram.com/"
}`;
  const formPostExample = `<form method="post" action="${endpointUrl}">
  <input type="hidden" name="token" value="SEU_TOKEN_SECRETO" />
  <input type="text" name="name" value="Mariana Costa" />
  <input type="email" name="email" value="mariana@empresa.com.br" />
  <input type="text" name="phone" value="11999887766" />
  <input type="text" name="utm_source" value="meta" />
  <input type="text" name="utm_campaign" value="black-friday" />
  <button type="submit">Enviar lead</button>
</form>`;
  const javascriptExample = `const payload = {
  name: "Mariana Costa",
  email: "mariana@empresa.com.br",
  phone: "11999887766",
  utm_source: "meta",
  utm_campaign: "black-friday"
};

const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer SEU_TOKEN_SECRETO"
  },
  body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);`;
  const pythonExample = `import requests

payload = {
    "name": "Mariana Costa",
    "email": "mariana@empresa.com.br",
    "phone": "11999887766",
    "utm_source": "meta",
    "utm_campaign": "black-friday",
}

response = requests.post(
    "${endpointUrl}",
    headers={
        "Authorization": "Bearer SEU_TOKEN_SECRETO",
        "Content-Type": "application/json",
    },
    json=payload,
    timeout=15,
)

print(response.status_code)
print(response.json())`;
  const phpExample = `<?php
$payload = [
    "name" => "Mariana Costa",
    "email" => "mariana@empresa.com.br",
    "phone" => "11999887766",
    "utm_source" => "meta",
    "utm_campaign" => "black-friday",
];

$ch = curl_init("${endpointUrl}");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer SEU_TOKEN_SECRETO",
    "Content-Type: application/json",
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo $status . PHP_EOL;
echo $response . PHP_EOL;`;
  const responseExample = `{
  "leadId": "0197f0d8-aaaa-bbbb-cccc-1234567890ab",
  "result": "created"
}`;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Webhooks / Documentação
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            {webhook.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Link técnico para integrar sistemas externos a este webhook.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/webhooks/${webhook.id}`}>Voltar ao webhook</Link>
        </Button>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Endpoint</CardTitle>
            <CardDescription>Use este endereço para enviar leads externos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                URL
              </p>
              <p className="mt-2 break-all font-medium text-foreground">{endpointUrl}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Autenticação
              </p>
              <p className="mt-2 text-muted-foreground">
                Envie `Authorization: Bearer SEU_TOKEN_SECRETO` ou `x-webhook-token`.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Formatos aceitos
              </p>
              <p className="mt-2 text-muted-foreground">
                `application/json` e `application/x-www-form-urlencoded`.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardHeader>
            <CardTitle>Regras</CardTitle>
            <CardDescription>Configuração ativa neste webhook.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Status: {webhook.status}</p>
            <p>Estágio inicial: {webhook.defaultStage?.name || "Não definido"}</p>
            <p>Origem padrão: {webhook.defaultSource || "Não definida"}</p>
            <p>Responsável padrão: {webhook.defaultOwner?.displayName || "Sem dono"}</p>
            <p>Deduplicação: {webhook.dedupKey}</p>
            <p>Ação na deduplicação: {webhook.dedupAction}</p>
            <p>Campos não mapeados: {webhook.unmappedPolicy}</p>
            <p>
              Validação mínima:{" "}
              {webhook.validation.requireEmailOrPhone === false
                ? "livre"
                : "e-mail ou telefone"}
            </p>
            <p>
              Criar cliente automático:{" "}
              {webhook.validation.createCustomerOnLeadCreate === false ? "não" : "sim"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exemplo de requisição</CardTitle>
          <CardDescription>Payload mínimo recomendado para integração.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
            <code>{curlExample}</code>
          </pre>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>JSON</CardTitle>
            <CardDescription>Exemplo de payload puro para POST em JSON.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{jsonExample}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>POST via Formulário Web</CardTitle>
            <CardDescription>Exemplo usando `application/x-www-form-urlencoded`.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{formPostExample}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JavaScript</CardTitle>
            <CardDescription>Exemplo com `fetch` no frontend ou backend Node.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{javascriptExample}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Python</CardTitle>
            <CardDescription>Exemplo com `requests`.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{pythonExample}</code>
            </pre>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>PHP</CardTitle>
            <CardDescription>Exemplo com `cURL` nativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{phpExample}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mapeamento ativo</CardTitle>
            <CardDescription>Como o payload é convertido em dados do CRM.</CardDescription>
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
                      Campo do payload
                    </p>
                    <p className="mt-1 font-medium text-foreground">{mapping.sourceField}</p>
                  </div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
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
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exemplo de resposta</CardTitle>
            <CardDescription>Retorno esperado quando o lead for aceito.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#0F1117] p-4 text-[12px] leading-5 text-white">
              <code>{responseExample}</code>
            </pre>
            <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              <p>`404` se o webhook não existir.</p>
              <p>`401` se o token for inválido.</p>
              <p>`400` se o payload for rejeitado.</p>
              <p>`429` se o rate limit for excedido.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
