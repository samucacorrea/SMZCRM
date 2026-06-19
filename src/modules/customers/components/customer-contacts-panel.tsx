"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CustomerContactAccessForm } from "@/modules/customers/components/customer-contact-access-form";
import { CustomerContactForm } from "@/modules/customers/components/customer-contact-form";
import { customerPortalPermissionLabels } from "@/modules/customers/validators";
import { deleteCustomerContactAction } from "@/modules/customers/actions";

type CustomerContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
  portalPermissions: string[];
};

export function CustomerContactsPanel({
  customerId,
  contacts,
}: {
  customerId: string;
  contacts: CustomerContact[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <CustomerContactForm customerId={customerId} />

      {contacts.map((contact) => (
        <div key={contact.id} className="rounded-xl border border-border bg-background p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{contact.name}</p>
              <p className="text-muted-foreground">{contact.jobTitle || "Sem cargo"}</p>
            </div>
            <div className="flex items-center gap-2">
              {contact.isPrimary ? (
                <span className="rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
                  Principal
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  startTransition(async () => {
                    await deleteCustomerContactAction(customerId, contact.id);
                    router.refresh();
                  })
                }
                disabled={isPending}
              >
                {isPending ? "Removendo..." : "Excluir"}
              </Button>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-muted-foreground">
            <p>{contact.email}</p>
            <p>{contact.phone || contact.whatsapp || "Sem telefone"}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {contact.portalPermissions.length > 0 ? (
              contact.portalPermissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                >
                  {customerPortalPermissionLabels[
                    permission as keyof typeof customerPortalPermissionLabels
                  ] ?? permission}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                Sem acesso ao portal
              </span>
            )}
          </div>
          <div className="mt-4">
            <CustomerContactAccessForm
              contact={{
                id: contact.id,
                customerId,
                isPrimary: contact.isPrimary,
                portalPermissions: contact.portalPermissions,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
