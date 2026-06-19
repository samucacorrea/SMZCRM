"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteLeadAttachmentAction } from "@/modules/leads/actions";
import { LeadAttachmentForm } from "@/modules/leads/components/lead-attachment-form";

type LeadAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  kind: "file" | "image" | "document";
  createdAt: Date;
  uploadedBy: {
    displayName: string;
  } | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LeadAttachmentsPanel({
  leadId,
  attachments,
}: {
  leadId: string;
  attachments: LeadAttachment[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <LeadAttachmentForm leadId={leadId} />

      {attachments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum anexo vinculado a este lead.
        </p>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {attachment.kind}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {attachment.contentType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{attachment.fileName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatBytes(attachment.sizeInBytes)}</span>
                    <span>
                      Enviado em{" "}
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(attachment.createdAt)}
                    </span>
                    <span>Por {attachment.uploadedBy?.displayName || "Sistema"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href={`/api/leads/${leadId}/attachments/${attachment.id}`} target="_blank">
                      Baixar
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteLeadAttachmentAction(leadId, attachment.id);
                        router.refresh();
                      })
                    }
                    disabled={isPending}
                  >
                    Excluir
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
