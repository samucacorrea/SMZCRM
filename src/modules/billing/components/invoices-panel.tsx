"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteInvoiceAction, updateInvoiceStatusAction } from "@/modules/billing/actions";

type Invoice = {
  id: string;
  number: string;
  status: "draft" | "issued" | "paid" | "overdue" | "canceled";
  description: string;
  issueDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  currency: string;
  amountInCents: number;
  externalReference: string | null;
  customer?: {
    tradeName: string | null;
    legalName: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
};

const statusLabel: Record<Invoice["status"], string> = {
  draft: "Rascunho",
  issued: "Emitida",
  paid: "Paga",
  overdue: "Vencida",
  canceled: "Cancelada",
};

export function InvoicesPanel({
  invoices,
  showCustomer = false,
  showProject = false,
}: {
  invoices: Invoice[];
  showCustomer?: boolean;
  showProject?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (invoices.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhuma fatura cadastrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {invoice.number}
                </span>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  {statusLabel[invoice.status]}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{invoice.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {showCustomer && invoice.customer ? (
                  <span>Cliente: {invoice.customer.tradeName || invoice.customer.legalName}</span>
                ) : null}
                {showProject && invoice.project ? <span>Projeto: {invoice.project.name}</span> : null}
                <span>
                  Valor:{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: invoice.currency,
                  }).format(invoice.amountInCents / 100)}
                </span>
                <span>
                  Vence em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                  }).format(invoice.dueDate)}
                </span>
                {invoice.paidAt ? (
                  <span>
                    Pago em{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(invoice.paidAt)}
                  </span>
                ) : null}
                {invoice.externalReference ? <span>Ref: {invoice.externalReference}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {invoice.status !== "issued" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    startTransition(async () => {
                      await updateInvoiceStatusAction(invoice.id, "issued");
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  Emitir
                </Button>
              ) : null}
              {invoice.status !== "paid" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await updateInvoiceStatusAction(invoice.id, "paid");
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  Marcar paga
                </Button>
              ) : null}
              {invoice.status !== "overdue" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    startTransition(async () => {
                      await updateInvoiceStatusAction(invoice.id, "overdue");
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  Marcar vencida
                </Button>
              ) : null}
              {invoice.status !== "canceled" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      await updateInvoiceStatusAction(invoice.id, "canceled");
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  startTransition(async () => {
                    await deleteInvoiceAction(invoice.id);
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
  );
}
