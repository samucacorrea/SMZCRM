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

export const updateLeadDetailsSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  name: z.string().min(3, "Nome obrigatorio"),
  company: z.string().optional(),
  email: z.string().email("E-mail invalido"),
  phone: z.string().min(8, "Telefone obrigatorio"),
  source: z.string().min(2, "Origem obrigatoria"),
  estimatedValue: z.coerce.number().min(0, "Valor invalido"),
  tags: z.string().optional(),
  description: z.string().optional(),
});

export const createLeadNoteSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  body: z.string().min(3, "Nota obrigatoria").max(5000, "Nota muito longa"),
});

export const createLeadReminderSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  description: z.string().min(3, "Descricao obrigatoria").max(500, "Descricao muito longa"),
  remindAt: z.coerce.date(),
  notifyCustomer: z.boolean().default(false),
});

export const completeLeadReminderSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  reminderId: z.string().uuid("Lembrete invalido"),
});

export const deleteLeadReminderSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  reminderId: z.string().uuid("Lembrete invalido"),
});

export const createLeadTaskSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  name: z.string().min(3, "Nome da tarefa obrigatorio").max(200, "Nome muito longo"),
  description: z.string().max(5000, "Descricao muito longa").optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.coerce.date().optional(),
  assignedStaffMemberIds: z
    .array(z.string().uuid("Responsavel invalido"))
    .min(1, "Selecione ao menos um responsavel."),
});

export const updateLeadTaskStatusSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  taskId: z.string().uuid("Tarefa invalida"),
  status: z.enum(["todo", "in_progress", "done"]),
});

export const deleteLeadTaskSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  taskId: z.string().uuid("Tarefa invalida"),
});

export const proposalItemSchema = z.object({
  description: z.string().min(2, "Descricao do item obrigatoria").max(200, "Descricao muito longa"),
  quantity: z.coerce.number().int("Quantidade invalida").min(1, "Quantidade minima 1"),
  unitPrice: z.coerce.number().min(0, "Valor unitario invalido"),
});

export const createLeadProposalSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  title: z.string().min(3, "Titulo obrigatorio").max(200, "Titulo muito longo"),
  validUntil: z.coerce.date().optional(),
  notes: z.string().max(5000, "Observacoes muito longas").optional().default(""),
  items: z.array(proposalItemSchema).min(1, "Adicione ao menos um item."),
});

export const updateLeadProposalStatusSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  proposalId: z.string().uuid("Proposta invalida"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
});

export const deleteLeadProposalSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  proposalId: z.string().uuid("Proposta invalida"),
});

export const deleteLeadAttachmentSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  attachmentId: z.string().uuid("Anexo invalido"),
});

export const createLeadFollowUpSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  channel: z.enum(["call", "whatsapp", "email", "meeting", "other"]),
  outcome: z.enum([
    "pending",
    "answered",
    "no_answer",
    "interested",
    "not_interested",
    "scheduled",
  ]),
  happenedAt: z.coerce.date(),
  summary: z.string().min(3, "Resumo obrigatorio").max(1000, "Resumo muito longo"),
  nextAction: z.string().max(1000, "Próxima ação muito longa").optional().default(""),
});

export const deleteLeadFollowUpSchema = z.object({
  leadId: z.string().uuid("Lead invalido"),
  followUpId: z.string().uuid("Follow-up invalido"),
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

export const bulkDeleteLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid("Lead invalido")).min(1, "Selecione ao menos um lead."),
});

export const bulkMoveLeadsStageSchema = z.object({
  leadIds: z.array(z.string().uuid("Lead invalido")).min(1, "Selecione ao menos um lead."),
  stageId: z.string().uuid("Estagio invalido"),
});

export const bulkQualifyLeadsSchema = z
  .object({
    leadIds: z.array(z.string().uuid("Lead invalido")).min(1, "Selecione ao menos um lead."),
    qualification: z.enum(["qualified", "lost"]),
    reason: z.string().optional().default(""),
  })
  .superRefine((input, context) => {
    if (input.qualification === "lost" && input.reason.trim().length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo da perda obrigatorio.",
        path: ["reason"],
      });
    }
  });

export const bulkAssignLeadOwnerSchema = z.object({
  leadIds: z.array(z.string().uuid("Lead invalido")).min(1, "Selecione ao menos um lead."),
  assignedStaffMemberId: z.string().uuid("Responsavel invalido").optional().or(z.literal("")),
});

export const bulkUpdateLeadTagsSchema = z.object({
  leadIds: z.array(z.string().uuid("Lead invalido")).min(1, "Selecione ao menos um lead."),
  tags: z.string().min(1, "Informe ao menos uma tag."),
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
