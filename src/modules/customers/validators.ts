import { z } from "zod";

import { isValidCpfCnpj, normalizeCep, normalizeCpfCnpj } from "@/lib/br-documents";

export const customerPortalPermissionValues = [
  "view_invoices",
  "view_projects",
  "open_tickets",
  "approve_documents",
] as const;

export const customerPortalPermissionLabels: Record<
  (typeof customerPortalPermissionValues)[number],
  string
> = {
  view_invoices: "Ver faturas",
  view_projects: "Ver projetos",
  open_tickets: "Abrir tickets",
  approve_documents: "Aprovar propostas e contratos",
};

export const createCustomerSchema = z.object({
  legalName: z.string().min(3, "Razao social obrigatoria"),
  tradeName: z.string().optional(),
  taxId: z
    .string()
    .transform(normalizeCpfCnpj)
    .refine((value) => value.length > 0, "CPF ou CNPJ obrigatorio")
    .refine(isValidCpfCnpj, "CPF/CNPJ invalido"),
  email: z.string().email("E-mail invalido"),
  contactName: z.string().min(3, "Nome do contato obrigatorio"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  website: z.union([z.literal(""), z.string().url("Site invalido")]).optional(),
  zipCode: z.string().optional().default("").transform(normalizeCep),
  addressLine1: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  neighborhood: z.string().optional().default(""),
  city: z.string().min(2, "Cidade obrigatoria"),
  state: z.string().min(2, "UF obrigatoria").max(2, "UF invalida"),
});

export const updateCustomerSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  legalName: z.string().min(3, "Razao social obrigatoria"),
  tradeName: z.string().optional(),
  taxId: z
    .string()
    .transform(normalizeCpfCnpj)
    .refine((value) => value.length > 0, "CPF ou CNPJ obrigatorio")
    .refine(isValidCpfCnpj, "CPF/CNPJ invalido"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  website: z.union([z.literal(""), z.string().url("Site invalido")]).optional(),
  zipCode: z.string().optional().default("").transform(normalizeCep),
  addressLine1: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  neighborhood: z.string().optional().default(""),
  city: z.string().min(2, "Cidade obrigatoria"),
  state: z.string().min(2, "UF obrigatoria").max(2, "UF invalida"),
});

export const createCustomerContactSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  name: z.string().min(3, "Nome do contato obrigatorio"),
  email: z.string().email("E-mail invalido"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  whatsapp: z.string().optional(),
  jobTitle: z.string().optional(),
  isPrimary: z.boolean().default(false),
  portalPermissions: z.array(z.enum(customerPortalPermissionValues)).default([]),
});

export const createCustomerCustomFieldSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  label: z.string().min(2, "Nome do campo obrigatorio"),
  key: z
    .string()
    .min(2, "Chave obrigatoria")
    .regex(/^[a-z][a-z0-9_]*$/, "Use apenas letras minusculas, numeros e underscore."),
  dataType: z.enum(["text", "number", "date", "boolean"]),
});

export const updateCustomerCustomDataSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
});

export const updateCustomerContactAccessSchema = z.object({
  contactId: z.string().uuid("Contato invalido"),
  customerId: z.string().uuid("Cliente invalido"),
  isPrimary: z.boolean().default(false),
  portalPermissions: z.array(z.enum(customerPortalPermissionValues)).default([]),
});

export const createCustomerNoteSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  body: z.string().min(3, "Nota obrigatoria").max(5000, "Nota muito longa"),
});

export const deleteCustomerContactSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  contactId: z.string().uuid("Contato invalido"),
});

export const deleteCustomerNoteSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  noteId: z.string().uuid("Nota invalida"),
});

export const importCustomerRowSchema = createCustomerSchema.extend({
  tradeName: z.string().optional().default(""),
  website: z.string().optional().default(""),
  zipCode: z.string().optional().default(""),
  addressLine1: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  neighborhood: z.string().optional().default(""),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateCustomerContactInput = z.infer<typeof createCustomerContactSchema>;
export type CreateCustomerCustomFieldInput = z.infer<typeof createCustomerCustomFieldSchema>;
export type UpdateCustomerContactAccessInput = z.infer<typeof updateCustomerContactAccessSchema>;
export type UpdateCustomerCustomDataInput = z.infer<typeof updateCustomerCustomDataSchema>;
export type CreateCustomerNoteInput = z.infer<typeof createCustomerNoteSchema>;
export type DeleteCustomerContactInput = z.infer<typeof deleteCustomerContactSchema>;
export type DeleteCustomerNoteInput = z.infer<typeof deleteCustomerNoteSchema>;
export type ImportCustomerRowInput = z.infer<typeof importCustomerRowSchema>;
