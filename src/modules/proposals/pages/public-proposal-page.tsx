import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicProposalAcceptForm } from "@/modules/proposals/components/public-proposal-accept-form";
import { getPublicProposalByToken } from "@/modules/proposals/queries";

const statusLabel = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
} as const;

export async function PublicProposalPageView({ token }: { token: string }) {
  const proposal = await getPublicProposalByToken(token);

  if (!proposal) {
    notFound();
  }

  const isExpired = Boolean(proposal.validUntil && proposal.validUntil.getTime() < Date.now());
  const acceptanceDisabled =
    isExpired || proposal.status === "accepted" || proposal.status === "rejected" || proposal.status === "expired";
  const notes =
    typeof proposal.content.notes === "string" ? proposal.content.notes : "";
  const customerLabel =
    proposal.customer?.tradeName ||
    proposal.customer?.legalName ||
    proposal.lead.company ||
    proposal.lead.name;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_32%),linear-gradient(180deg,_#f7f9fc,_#eef2f7)] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              NúcleoCRM / Proposta pública
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {proposal.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {proposal.number} · {customerLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-right shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {isExpired ? "Expirada" : statusLabel[proposal.status]}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: proposal.currency || "BRL",
              }).format(proposal.totalInCents / 100)}
            </p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardHeader>
              <CardTitle>Itens da proposta</CardTitle>
              <CardDescription>
                Escopo comercial apresentado para aprovação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: proposal.currency || "BRL",
                      }).format(item.unitPriceInCents / 100)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: proposal.currency || "BRL",
                    }).format(item.totalInCents / 100)}
                  </p>
                </div>
              ))}

              {notes ? (
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Observações
                  </p>
                  <p className="mt-2 text-sm text-foreground">{notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardHeader>
              <CardTitle>Aceite</CardTitle>
              <CardDescription>
                {proposal.validUntil
                  ? `Válida até ${new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(proposal.validUntil)}.`
                  : "Sem data de expiração definida."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal.status === "accepted" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Proposta aceita
                  {proposal.acceptedAt
                    ? ` em ${new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(proposal.acceptedAt)}`
                    : ""}.
                  {typeof proposal.signature.signerName === "string"
                    ? ` Assinante: ${proposal.signature.signerName}.`
                    : ""}
                </div>
              ) : null}

              {isExpired ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Esta proposta expirou e não pode mais ser aceita.
                </div>
              ) : null}

              {proposal.status === "rejected" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  Esta proposta foi marcada como recusada.
                </div>
              ) : null}

              <PublicProposalAcceptForm
                publicToken={proposal.publicToken}
                disabled={acceptanceDisabled}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
