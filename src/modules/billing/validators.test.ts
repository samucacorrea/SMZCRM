import { describe, expect, it } from "vitest";

import {
  createInvoiceSchema,
  createProjectHoursInvoiceSchema,
  deleteInvoiceSchema,
  updateInvoiceStatusSchema,
} from "@/modules/billing/validators";

describe("billing validators", () => {
  it("accepts a valid invoice payload", () => {
    const result = createInvoiceSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      description: "Mensalidade de gestão de tráfego",
      issueDate: "2026-06-19T10:00",
      dueDate: "2026-06-25T10:00",
      amount: 2490.5,
      currency: "BRL",
      externalReference: "ASAAS-123",
      notes: "Cobrança referente ao ciclo de junho.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating an invoice status", () => {
    const result = updateInvoiceStatusSchema.safeParse({
      invoiceId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      status: "paid",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting an invoice", () => {
    const result = deleteInvoiceSchema.safeParse({
      invoiceId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
    });

    expect(result.success).toBe(true);
  });

  it("accepts generating an invoice from project hours", () => {
    const result = createProjectHoursInvoiceSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      issueDate: "2026-06-22T10:00",
      dueDate: "2026-06-29T10:00",
      notes: "Ciclo semanal de operacao.",
    });

    expect(result.success).toBe(true);
  });
});
