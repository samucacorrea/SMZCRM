import { z } from "zod";

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  projectId: z.string().uuid("Projeto invalido").optional(),
  description: z.string().min(3, "Descricao obrigatoria").max(500, "Descricao muito longa"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  amount: z.coerce.number().min(0.01, "Valor invalido"),
  currency: z.string().min(3, "Moeda obrigatoria").max(3, "Moeda invalida"),
  externalReference: z.string().max(120, "Referencia muito longa").optional().default(""),
  notes: z.string().max(5000, "Observacoes muito longas").optional().default(""),
});

export const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string().uuid("Fatura invalida"),
  status: z.enum(["draft", "issued", "paid", "overdue", "canceled"]),
});

export const deleteInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Fatura invalida"),
});

export const createProjectHoursInvoiceSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  notes: z.string().max(5000, "Observacoes muito longas").optional().default(""),
});
