"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteCustomerNoteAction } from "@/modules/customers/actions";
import { CustomerNoteForm } from "@/modules/customers/components/customer-note-form";

type CustomerNote = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    displayName: string;
  } | null;
};

export function CustomerNotesPanel({
  customerId,
  notes,
}: {
  customerId: string;
  notes: CustomerNote[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <CustomerNoteForm customerId={customerId} />
      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma nota registrada ainda.
        </p>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-border bg-background p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{note.author?.displayName || "Sistema"}</span>
              <div className="flex items-center gap-3">
                <span>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(note.createdAt)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteCustomerNoteAction(customerId, note.id);
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  {isPending ? "Removendo..." : "Excluir"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-foreground">{note.body}</p>
          </div>
        ))
      )}
    </div>
  );
}
