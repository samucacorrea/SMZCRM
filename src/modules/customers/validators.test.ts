import { describe, expect, it } from "vitest";

import {
  formatCep,
  formatCpfCnpj,
  isValidCpfCnpj,
} from "@/lib/br-documents";
import {
  customerPortalPermissionValues,
  createCustomerContactSchema,
  createCustomerCustomFieldSchema,
  createCustomerNoteSchema,
  createCustomerSchema,
  deleteCustomerContactSchema,
  deleteCustomerNoteSchema,
  updateCustomerContactAccessSchema,
  updateCustomerCustomDataSchema,
  updateCustomerSchema,
} from "@/modules/customers/validators";

describe("createCustomerSchema", () => {
  it("accepts a valid payload", () => {
    const result = createCustomerSchema.safeParse({
      legalName: "Acme LTDA",
      tradeName: "Acme",
      taxId: "11.444.777/0001-61",
      email: "contato@acme.com",
      contactName: "Maria Silva",
      phone: "11999999999",
      website: "https://acme.com",
      zipCode: "01001-000",
      addressLine1: "Rua A",
      neighborhood: "Centro",
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

  it("validates cpf/cnpj helper functions", () => {
    expect(isValidCpfCnpj("11144477735")).toBe(true);
    expect(isValidCpfCnpj("11444777000161")).toBe(true);
    expect(formatCpfCnpj("11444777000161")).toBe("11.444.777/0001-61");
    expect(formatCep("01001000")).toBe("01001-000");
  });

  it("accepts a valid customer contact", () => {
    const result = createCustomerContactSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Maria Silva",
      email: "maria@acme.com",
      phone: "11999999999",
      whatsapp: "11999999999",
      jobTitle: "Financeiro",
      isPrimary: true,
      portalPermissions: [customerPortalPermissionValues[0]],
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating a customer", () => {
    const result = updateCustomerSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      legalName: "Acme LTDA",
      tradeName: "Acme",
      taxId: "11.444.777/0001-61",
      phone: "11999999999",
      website: "https://acme.com",
      zipCode: "01001-000",
      addressLine1: "Rua A",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating portal access for a contact", () => {
    const result = updateCustomerContactAccessSchema.safeParse({
      contactId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      isPrimary: false,
      portalPermissions: ["view_invoices", "open_tickets"],
    });

    expect(result.success).toBe(true);
  });

  it("accepts creating customer custom fields", () => {
    const result = createCustomerCustomFieldSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      label: "Plano contratado",
      key: "plano_contratado",
      dataType: "text",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating customer custom data", () => {
    const result = updateCustomerCustomDataSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
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

  it("accepts deleting a contact", () => {
    const result = deleteCustomerContactSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      contactId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a note", () => {
    const result = deleteCustomerNoteSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      noteId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });
});
