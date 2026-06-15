import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { CustomerCreateLightbox } from "@/modules/customers/components/customer-create-lightbox";
import { CustomerImportForm } from "@/modules/customers/components/customer-import-form";
import { listCustomersByTenant } from "@/modules/customers/queries";

function CustomerListItem({
  customer,
}: {
  customer: Awaited<ReturnType<typeof listCustomersByTenant>>[number];
}) {
  const primaryContact = customer.contacts.find((contact) => contact.isPrimary);

  return (
    <Link
      href={`/customers/${customer.id}`}
      className="block rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div className="flex items-stretch">
        <div className="w-1 rounded-l-xl bg-primary" />
        <div className="flex flex-1 items-start justify-between gap-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {customer.tradeName || customer.legalName}
              </p>
              <span className="rounded-full bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground">
                Cliente
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {customer.taxId}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>
              {customer.city}/{customer.state}
            </p>
            <p>{primaryContact?.email ?? "Sem contato principal"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export async function CustomersPageView() {
  await assertPermission("customers", "view");
  const tenantContext = await getTenantContext();
  const customers = await listCustomersByTenant(tenantContext.tenantId);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Clientes
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            Base de clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A listagem é a tela principal. O cadastro abre em lightbox sobre a base.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-11 px-5" variant="outline">
            <Link href="#importacao-clientes">Importar CSV</Link>
          </Button>
          <CustomerCreateLightbox />
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Clientes cadastrados</CardTitle>
          <CardDescription>
            Listagem operacional com acesso direto ao perfil do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : (
            customers.map((customer) => (
              <CustomerListItem key={customer.id} customer={customer} />
            ))
          )}
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total
          </p>
          <p className="text-lg font-semibold text-foreground">{customers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Com contato
          </p>
          <p className="text-lg font-semibold text-foreground">
            {customers.filter((customer) => customer.contacts.length > 0).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Último estado
          </p>
          <p className="text-lg font-semibold text-foreground">
            {customers.at(0)?.state ?? "--"}
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card id="importacao-clientes">
          <CardHeader>
            <CardTitle>Importação CSV</CardTitle>
            <CardDescription>
              Onboarding em lote com validação por linha no servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerImportForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de cadastro</CardTitle>
            <CardDescription>
              Mantém a listagem limpa e joga a criação para uma sobreposição focada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Revise a base na listagem antes de cadastrar novos registros.</p>
            <p>2. Clique em `Adicionar cliente` para abrir o cadastro em lightbox com fundo borrado.</p>
            <p>3. Use CSV apenas quando vier de base legada ou migração.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
