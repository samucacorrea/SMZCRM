import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(3, "Nome obrigatorio"),
  company: z.string().optional(),
  email: z.string().email("E-mail invalido"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  source: z.string().min(2, "Origem obrigatoria"),
  stageId: z.string().uuid("Estagio invalido"),
  estimatedValue: z.coerce.number().min(0, "Valor invalido"),
  tags: z.string().optional(),
  description: z.string().optional(),
});

export const createLeadNoteSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  body: z.string().min(3, "Nota obrigatoria").max(5000, "Nota muito longa"),
});

export const moveLeadStageSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  stageId: z.string().uuid("Estagio invalido"),
});

export const qualifyLeadSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
});

export const markLeadLostSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  reason: z.string().min(3, "Motivo da perda obrigatorio").max(500, "Motivo muito longo"),
});

export const closeWonLeadSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  saleValue: z.coerce.number().min(0.01, "Valor da venda obrigatorio"),
  currency: z.string().min(3, "Moeda obrigatoria").max(3, "Moeda invalida"),
});

export const importLeadRowSchema = z.object({
  name: z.string().min(3, "Nome obrigatorio"),
  company: z.string().optional().default(""),
  email: z.string().email("E-mail invalido"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  source: z.string().min(2, "Origem obrigatoria"),
  stageName: z.string().min(2, "Estagio obrigatorio"),
  estimatedValue: z.coerce.number().min(0, "Valor invalido"),
  tags: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
