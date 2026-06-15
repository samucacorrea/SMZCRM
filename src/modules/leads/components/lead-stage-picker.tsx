"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { moveLeadStageAction } from "@/modules/leads/actions";

export function LeadStagePicker({
  leadId,
  currentStageId,
  stages,
}: {
  leadId: string;
  currentStageId: string;
  stages: Array<{ id: string; name: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={currentStageId}
      disabled={isPending}
      onChange={(event) =>
        startTransition(async () => {
          await moveLeadStageAction({
            leadId,
            stageId: event.target.value,
          });
          router.refresh();
        })
      }
      className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
    >
      {stages.map((stage) => (
        <option key={stage.id} value={stage.id}>
          {isPending && stage.id === currentStageId ? "Atualizando..." : stage.name}
        </option>
      ))}
    </select>
  );
}
