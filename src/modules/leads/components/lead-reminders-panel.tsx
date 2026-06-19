"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LeadReminderForm } from "@/modules/leads/components/lead-reminder-form";
import {
  completeLeadReminderAction,
  deleteLeadReminderAction,
} from "@/modules/leads/actions";

type LeadReminderItem = {
  id: string;
  description: string;
  remindAt: Date;
  status: "pending" | "completed" | "canceled";
  notifyCustomer: boolean;
  completedAt: Date | null;
  createdBy: {
    displayName: string;
  } | null;
  completedBy: {
    displayName: string;
  } | null;
};

const statusLabel: Record<LeadReminderItem["status"], string> = {
  pending: "Pendente",
  completed: "Concluido",
  canceled: "Cancelado",
};

export function LeadRemindersPanel({
  leadId,
  reminders,
}: {
  leadId: string;
  reminders: LeadReminderItem[];
}) {
  const router = useRouter();
  const [isCompleting, startCompleting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const pendingReminders = useMemo(
    () => reminders.filter((reminder) => reminder.status === "pending"),
    [reminders],
  );
  const completedReminders = useMemo(
    () => reminders.filter((reminder) => reminder.status !== "pending"),
    [reminders],
  );

  return (
    <div className="space-y-4">
      <LeadReminderForm leadId={leadId} />

      {reminders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum lembrete cadastrado para este lead.
        </p>
      ) : (
        <div className="space-y-3">
          {[...pendingReminders, ...completedReminders].map((reminder) => (
            <div
              key={reminder.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        reminder.status === "pending"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel[reminder.status]}
                    </span>
                    {reminder.notifyCustomer ? (
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                        Contato com cliente
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-foreground">{reminder.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Lembrar em{" "}
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(reminder.remindAt)}
                    </span>
                    <span>Criado por {reminder.createdBy?.displayName || "Sistema"}</span>
                    {reminder.completedAt ? (
                      <span>
                        Concluido em{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(reminder.completedAt)}
                        {reminder.completedBy ? ` por ${reminder.completedBy.displayName}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {reminder.status === "pending" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        startCompleting(async () => {
                          await completeLeadReminderAction(leadId, reminder.id);
                          router.refresh();
                        })
                      }
                      disabled={isCompleting}
                    >
                      {isCompleting ? "Concluindo..." : "Concluir"}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startDeleting(async () => {
                        await deleteLeadReminderAction(leadId, reminder.id);
                        router.refresh();
                      })
                    }
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Removendo..." : "Excluir"}
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
