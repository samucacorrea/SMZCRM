import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { CustomerContactsPanel } from "@/modules/customers/components/customer-contacts-panel";
import { CustomerCustomDataForm } from "@/modules/customers/components/customer-custom-data-form";
import { CustomerCustomFieldCreateForm } from "@/modules/customers/components/customer-custom-field-create-form";
import { CustomerDetailsForm } from "@/modules/customers/components/customer-details-form";
import { CustomerNotesPanel } from "@/modules/customers/components/customer-notes-panel";
import { InvoiceCreateForm } from "@/modules/billing/components/invoice-create-form";
import { InvoicesPanel } from "@/modules/billing/components/invoices-panel";
import { ProjectCreateForm } from "@/modules/projects/components/project-create-form";
import { ProjectsPanel } from "@/modules/projects/components/projects-panel";
import { getCustomerById, listCustomerCustomFieldsByTenant } from "@/modules/customers/queries";

const tabs = [
  "Resumo",
  "Contatos",
  "Faturas",
  "Projetos",
  "Propostas",
  "Tickets",
  "Contratos",
  "Notas",
  "Arquivos",
  "Campos extras",
];

export async function CustomerProfilePageView({ customerId }: { customerId: string }) {
  await assertPermission("customers", "view");
  const tenantContext = await getTenantContext();
  const [customer, customFields] = await Promise.all([
    getCustomerById(tenantContext.tenantId, customerId),
    listCustomerCustomFieldsByTenant(tenantContext.tenantId),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            CRM / Clientes / Perfil
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            {customer.tradeName || customer.legalName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.taxId} · {customer.city}/{customer.state}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Contatos
            </p>
            <p className="text-lg font-semibold text-foreground">{customer.contacts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Notas
            </p>
            <p className="text-lg font-semibold text-foreground">{customer.notes.length}</p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap gap-2 p-4">
          {tabs.map((tab, index) => (
            <span
              key={tab}
              className={`rounded-full px-3 py-1 text-sm ${
                index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {tab}
            </span>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <p>Razão social: {customer.legalName}</p>
            <p>Nome fantasia: {customer.tradeName || "Não informado"}</p>
            <p>Telefone: {customer.phone || "Não informado"}</p>
            <p>Site: {customer.website || "Não informado"}</p>
            <p>Moeda padrão: {customer.currency}</p>
            <p>País: {customer.country}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-primary/70" />
          <CardHeader>
            <CardTitle>Dados do cliente</CardTitle>
            <CardDescription>
              Atualize cadastro, endereço e dados fiscais sem sair do perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerDetailsForm customer={customer} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1 bg-accent" />
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
          <CardDescription>Contato primário e equipe ligada ao cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerContactsPanel customerId={customer.id} contacts={customer.contacts} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-primary/70" />
        <CardHeader>
          <CardTitle>Faturas</CardTitle>
          <CardDescription>Cobranças emitidas para este cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InvoiceCreateForm
            customers={[
              {
                id: customer.id,
                legalName: customer.legalName,
                tradeName: customer.tradeName,
              },
            ]}
            defaultCustomerId={customer.id}
          />
          <InvoicesPanel invoices={customer.invoices} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-primary/50" />
        <CardHeader>
          <CardTitle>Projetos</CardTitle>
          <CardDescription>Operação ativa deste cliente com orçamento e progresso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProjectCreateForm
            customers={[
              {
                id: customer.id,
                legalName: customer.legalName,
                tradeName: customer.tradeName,
              },
            ]}
            defaultCustomerId={customer.id}
          />
          <ProjectsPanel projects={customer.projects} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-accent" />
        <CardHeader>
          <CardTitle>Notas internas</CardTitle>
          <CardDescription>Registro comercial com autor e data.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerNotesPanel customerId={customer.id} notes={customer.notes} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="h-1 bg-accent/80" />
        <CardHeader>
          <CardTitle>Campos extras</CardTitle>
          <CardDescription>
            Dados complementares do cliente definidos pelo proprio tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <CustomerCustomFieldCreateForm customerId={customer.id} />
          {customFields.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum campo extra criado ainda para clientes.
            </p>
          ) : (
            <CustomerCustomDataForm
              customerId={customer.id}
              customFields={customFields.map((field) => ({
                id: field.id,
                key: field.key,
                label: field.label,
                dataType: field.dataType,
                isRequired: field.isRequired,
              }))}
              customData={(customer.customData ?? {}) as Record<string, unknown>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
