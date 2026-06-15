"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { moveLeadStageAction } from "@/modules/leads/actions";

type Stage = {
  id: string;
  name: string;
  color: string;
};

type Lead = {
  id: string;
  stageId: string;
  name: string;
  company: string | null;
  source: string;
  estimatedValueInCents: number;
};

export function LeadKanbanBoard({
  stages,
  leads,
}: {
  stages: Stage[];
  leads: Lead[];
}) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="grid gap-4 xl:grid-cols-6">
      {stages.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.stageId === stage.id);

        return (
          <div
            key={stage.id}
            className="rounded-xl border border-border bg-card p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();

              if (!draggedLeadId) {
                return;
              }

              startTransition(async () => {
                await moveLeadStageAction({
                  leadId: draggedLeadId,
                  stageId: stage.id,
                });
                setDraggedLeadId(null);
                router.refresh();
              });
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <p className="text-sm font-semibold">{stage.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
            </div>
            <div className="space-y-3">
              {stageLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  draggable
                  onDragStart={() => setDraggedLeadId(lead.id)}
                  className="block rounded-xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <p className="text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.company || "Sem empresa"}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{lead.source}</span>
                    <span>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(lead.estimatedValueInCents / 100)}
                    </span>
                  </div>
                </Link>
              ))}
              {stageLeads.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  {isPending ? "Atualizando..." : "Solte leads aqui"}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
