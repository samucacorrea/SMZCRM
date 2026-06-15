"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { convertLeadToCustomerAction } from "@/modules/leads/actions";

export function LeadConvertButton({
  leadId,
  convertedCustomerId,
}: {
  leadId: string;
  convertedCustomerId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      onClick={() =>
        startTransition(async () => {
          await convertLeadToCustomerAction(leadId);
          router.refresh();
        })
      }
      disabled={isPending || Boolean(convertedCustomerId)}
    >
      {convertedCustomerId
        ? "Já convertido"
        : isPending
          ? "Convertendo..."
          : "Converter em cliente"}
    </Button>
  );
}
