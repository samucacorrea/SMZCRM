import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { InvoiceCreateForm } from "@/modules/billing/components/invoice-create-form";
import { InvoicesPanel } from "@/modules/billing/components/invoices-panel";
import { listBillableCustomersByTenant, listInvoicesByTenant } from "@/modules/billing/queries";

export async function BillingInvoicesPageView() {
  await assertPermission("billing", "view");
  const tenantContext = await getTenantContext();
  const [customers, invoices] = await Promise.all([
    listBillableCustomersByTenant(tenantContext.tenantId),
    listInvoicesByTenant(tenantContext.tenantId),
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Faturas
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Cobranças e faturamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Emissão manual inicial para organizar o pós-venda financeiro por cliente.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Faturas</p>
          <p className="text-lg font-semibold text-foreground">{invoices.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Emitidas</p>
          <p className="text-lg font-semibold text-foreground">
            {invoices.filter((invoice) => invoice.status === "issued").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pagas</p>
          <p className="text-lg font-semibold text-foreground">
            {invoices.filter((invoice) => invoice.status === "paid").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Clientes</p>
          <p className="text-lg font-semibold text-foreground">{customers.length}</p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nova fatura</CardTitle>
            <CardDescription>Crie cobranças manuais vinculadas a um cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                Cadastre um cliente antes de gerar a primeira fatura.
              </p>
            ) : (
              <InvoiceCreateForm customers={customers} />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Faturas recentes</CardTitle>
            <CardDescription>Visão operacional das cobranças por status e cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoicesPanel invoices={invoices} showCustomer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
