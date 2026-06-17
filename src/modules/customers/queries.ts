import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customFields, customerContacts, customerNotes, customers } from "@/lib/db/schema";

export async function listCustomersByTenant(tenantId: string) {
  return db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    with: {
      contacts: true,
    },
    orderBy: [desc(customers.createdAt)],
  });
}

export async function getCustomerById(tenantId: string, customerId: string) {
  return db.query.customers.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, customerId), eq(table.tenantId, tenantId)),
    with: {
      contacts: {
        orderBy: [desc(customerContacts.isPrimary), desc(customerContacts.createdAt)],
      },
      notes: {
        orderBy: [desc(customerNotes.createdAt)],
        with: {
          author: true,
        },
      },
    },
  });
}

export async function listCustomerCustomFieldsByTenant(tenantId: string) {
  return db.query.customFields.findMany({
    where: and(eq(customFields.tenantId, tenantId), eq(customFields.entity, "customer")),
    orderBy: (fields, { asc }) => [asc(fields.label)],
  });
}
