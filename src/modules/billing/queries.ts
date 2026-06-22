import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers, invoices } from "@/lib/db/schema";

export async function listInvoicesByTenant(
  tenantId: string,
  options?: { customerId?: string; projectId?: string; status?: string },
) {
  return db.query.invoices.findMany({
    where: and(
      eq(invoices.tenantId, tenantId),
      options?.customerId ? eq(invoices.customerId, options.customerId) : undefined,
      options?.projectId ? eq(invoices.projectId, options.projectId) : undefined,
      options?.status ? eq(invoices.status, options.status as typeof invoices.$inferSelect.status) : undefined,
    ),
    with: {
      customer: true,
      project: true,
      createdBy: true,
    },
    orderBy: [desc(invoices.dueDate), desc(invoices.createdAt)],
  });
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)),
    with: {
      customer: true,
      project: true,
      createdBy: true,
    },
  });
}

export async function listBillableCustomersByTenant(tenantId: string) {
  return db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    orderBy: (fields, { asc }) => [asc(fields.legalName)],
  });
}
