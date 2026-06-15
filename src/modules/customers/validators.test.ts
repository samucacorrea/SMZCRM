import { describe, expect, it } from "vitest";

import {
  createCustomerContactSchema,
  createCustomerNoteSchema,
  createCustomerSchema,
} from "@/modules/customers/validators";

describe("createCustomerSchema", () => {
  it("accepts a valid payload", () => {
    const result = createCustomerSchema.safeParse({
      legalName: "Acme LTDA",
      tradeName: "Acme",
      taxId: "12345678901234",
      email: "contato@acme.com",
      contactName: "Maria Silva",
      phone: "11999999999",
      website: "https://acme.com",
      city: "Sao Paulo",
      state: "SP",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid website", () => {
    const result = createCustomerSchema.safeParse({
      legalName: "Acme LTDA",
      tradeName: "Acme",
      taxId: "12345678901234",
      email: "contato@acme.com",
      contactName: "Maria Silva",
      phone: "11999999999",
      website: "acme.com",
      city: "Sao Paulo",
      state: "SP",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid customer contact", () => {
    const result = createCustomerContactSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Maria Silva",
      email: "maria@acme.com",
      phone: "11999999999",
      whatsapp: "11999999999",
      jobTitle: "Financeiro",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty customer notes", () => {
    const result = createCustomerNoteSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      body: "",
    });

    expect(result.success).toBe(false);
  });
});
