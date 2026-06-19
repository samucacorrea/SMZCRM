"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteLeadFollowUpAction } from "@/modules/leads/actions";
import { LeadFollowUpForm } from "@/modules/leads/components/lead-follow-up-form";

type LeadFollowUp = {
  id: string;
  channel: "call" | "whatsapp" | "email" | "meeting" | "other";
  outcome:
    | "pending"
    | "answered"
    | "no_answer"
    | "interested"
    | "not_interested"
    | "scheduled";
  happenedAt: Date;
  summary: string;
  nextAction: string | null;
  createdAt: Date;
  createdBy: {
    displayName: string;
  } | null;
};

const channelLabel: Record<LeadFollowUp["channel"], string> = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  meeting: "Reunião",
  other: "Outro",
};

const outcomeLabel: Record<LeadFollowUp["outcome"], string> = {
  pending: "Pendente",
  answered: "Respondeu",
  no_answer: "Sem resposta",
  interested: "Interessado",
  not_interested: "Sem interesse",
  scheduled: "Agendado",
};

export function LeadFollowUpsPanel({
  leadId,
  followUps,
}: {
  leadId: string;
  followUps: LeadFollowUp[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <LeadFollowUpForm leadId={leadId} />

      {followUps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum follow-up registrado para este lead.
        </p>
      ) : (
        <div className="space-y-3">
          {followUps.map((followUp) => (
            <div key={followUp.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {channelLabel[followUp.channel]}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {outcomeLabel[followUp.outcome]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{followUp.summary}</p>
                  {followUp.nextAction ? (
                    <p className="text-sm text-muted-foreground">
                      Próxima ação: {followUp.nextAction}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Contato em{" "}
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(followUp.happenedAt)}
                    </span>
                    <span>Registrado por {followUp.createdBy?.displayName || "Sistema"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteLeadFollowUpAction(leadId, followUp.id);
                        router.refresh();
                      })
                    }
                    disabled={isPending}
                  >
                    {isPending ? "Removendo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
