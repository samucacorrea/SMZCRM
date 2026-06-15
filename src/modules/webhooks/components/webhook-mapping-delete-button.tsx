"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteWebhookMappingAction } from "@/modules/webhooks/actions";

export function WebhookMappingDeleteButton({
  webhookId,
  mappingId,
}: {
  webhookId: string;
  mappingId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteWebhookMappingAction(webhookId, mappingId);
        });
      }}
    >
      {isPending ? "Removendo..." : "Remover"}
    </Button>
  );
}
