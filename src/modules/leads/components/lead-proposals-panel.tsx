"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  deleteLeadProposalAction,
  updateLeadProposalStatusAction,
} from "@/modules/leads/actions";
import { LeadProposalForm } from "@/modules/leads/components/lead-proposal-form";

type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

type LeadProposalItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
};

type LeadProposal = {
  id: string;
  number: string;
  title: string;
  status: ProposalStatus;
  validUntil: Date | null;
  publicToken: string;
  subtotalInCents: number;
  totalInCents: number;
  currency: string;
  acceptedAt: Date | null;
  content: Record<string, unknown>;
  items: LeadProposalItem[];
};

const statusLabel: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
};

export function LeadProposalsPanel({
  leadId,
  proposals,
}: {
  leadId: string;
  proposals: LeadProposal[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <LeadProposalForm leadId={leadId} />

      {proposals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma proposta criada para este lead.
        </p>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {proposal.number}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {statusLabel[proposal.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{proposal.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Total:{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: proposal.currency || "BRL",
                      }).format(proposal.totalInCents / 100)}
                    </span>
                    <span>
                      Validade:{" "}
                      {proposal.validUntil
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(proposal.validUntil)
                        : "Sem data"}
                    </span>
                    {proposal.acceptedAt ? (
                      <span>
                        Aceita em{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(proposal.acceptedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href={`/proposals/${proposal.publicToken}`} target="_blank">
                      Abrir link público
                    </Link>
                  </Button>
                  {proposal.status !== "sent" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        startTransition(async () => {
                          await updateLeadProposalStatusAction(leadId, proposal.id, "sent");
                          router.refresh();
                        })
                      }
                      disabled={isPending}
                    >
                      Marcar enviada
                    </Button>
                  ) : null}
                  {proposal.status !== "accepted" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        startTransition(async () => {
                          await updateLeadProposalStatusAction(leadId, proposal.id, "accepted");
                          router.refresh();
                        })
                      }
                      disabled={isPending}
                    >
                      Aceitar
                    </Button>
                  ) : null}
                  {proposal.status !== "rejected" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        startTransition(async () => {
                          await updateLeadProposalStatusAction(leadId, proposal.id, "rejected");
                          router.refresh();
                        })
                      }
                      disabled={isPending}
                    >
                      Recusar
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteLeadProposalAction(leadId, proposal.id);
                        router.refresh();
                      })
                    }
                    disabled={isPending}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {proposal.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">
                      {item.description} · {item.quantity}x
                    </span>
                    <span className="text-muted-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: proposal.currency || "BRL",
                      }).format(item.totalInCents / 100)}
                    </span>
                  </div>
                ))}
              </div>

              {typeof proposal.content.notes === "string" && proposal.content.notes.length > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{proposal.content.notes}</p>
              ) : null}

              <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Token público preparado: <span className="font-mono">{proposal.publicToken}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
