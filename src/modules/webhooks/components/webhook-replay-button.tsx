"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { replayInboundWebhookLogAction } from "@/modules/webhooks/actions";

export function WebhookReplayButton({
  webhookId,
  logId,
}: {
  webhookId: string;
  logId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await replayInboundWebhookLogAction(webhookId, logId);
        });
      }}
    >
      {isPending ? "Reprocessando..." : "Reprocessar"}
    </Button>
  );
}
