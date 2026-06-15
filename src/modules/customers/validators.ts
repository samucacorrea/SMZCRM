import { z } from "zod";

export const createCustomerSchema = z.object({
  legalName: z.string().min(3, "Razao social obrigatoria"),
  tradeName: z.string().optional(),
  taxId: z.string().min(11, "CPF ou CNPJ obrigatorio"),
  email: z.string().email("E-mail invalido"),
  contactName: z.string().min(3, "Nome do contato obrigatorio"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  website: z.union([z.literal(""), z.string().url("Site invalido")]).optional(),
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
});

export const createCustomerNoteSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  body: z.string().min(3, "Nota obrigatoria").max(5000, "Nota muito longa"),
});

export const importCustomerRowSchema = createCustomerSchema.extend({
  tradeName: z.string().optional().default(""),
  website: z.string().optional().default(""),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateCustomerContactInput = z.infer<typeof createCustomerContactSchema>;
export type CreateCustomerNoteInput = z.infer<typeof createCustomerNoteSchema>;
export type ImportCustomerRowInput = z.infer<typeof importCustomerRowSchema>;
