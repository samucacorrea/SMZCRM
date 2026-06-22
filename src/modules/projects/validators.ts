import { z } from "zod";

export const createProjectSchema = z.object({
  customerId: z.string().uuid("Cliente invalido"),
  name: z.string().min(3, "Nome do projeto obrigatorio").max(200, "Nome muito longo"),
  description: z.string().max(5000, "Descricao muito longa").optional().default(""),
  billingType: z.enum(["fixed", "project_hour", "task_hour"]),
  status: z.enum(["planning", "active", "on_hold", "completed", "canceled"]),
  health: z.enum(["healthy", "attention", "critical"]),
  currency: z.string().min(3, "Moeda obrigatoria").max(3, "Moeda invalida"),
  rate: z.coerce.number().min(0, "Valor hora invalido"),
  budget: z.coerce.number().min(0, "Orcamento invalido"),
  progress: z.coerce.number().int("Progresso invalido").min(0).max(100),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateProjectStatusSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  status: z.enum(["planning", "active", "on_hold", "completed", "canceled"]),
  health: z.enum(["healthy", "attention", "critical"]),
  progress: z.coerce.number().int("Progresso invalido").min(0).max(100),
});

export const createProjectTaskSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  name: z.string().min(3, "Nome da tarefa obrigatorio").max(200, "Nome muito longo"),
  description: z.string().max(5000, "Descricao muito longa").optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.coerce.date().optional(),
  assignedStaffMemberIds: z
    .array(z.string().uuid("Responsavel invalido"))
    .min(1, "Selecione ao menos um responsavel."),
});

export const updateProjectTaskStatusSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  taskId: z.string().uuid("Tarefa invalida"),
  status: z.enum(["todo", "in_progress", "done"]),
});

export const deleteProjectTaskSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  taskId: z.string().uuid("Tarefa invalida"),
});

export const createProjectTimeEntrySchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  taskId: z.string().uuid("Tarefa invalida"),
  staffId: z.string().uuid("Responsavel invalido"),
  workedAt: z.coerce.date(),
  durationMinutes: z.coerce
    .number()
    .int("Duracao invalida")
    .min(1, "Informe ao menos 1 minuto.")
    .max(24 * 60, "Duracao maxima de 24 horas."),
  billable: z.boolean().default(true),
  notes: z.string().max(5000, "Observacoes muito longas").optional().default(""),
});

export const deleteProjectTimeEntrySchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  entryId: z.string().uuid("Registro invalido"),
});

export const startProjectTimerSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  taskId: z.string().uuid("Tarefa invalida"),
  staffId: z.string().uuid("Responsavel invalido"),
  billable: z.boolean().default(true),
  notes: z.string().max(5000, "Observacoes muito longas").optional().default(""),
});

export const stopProjectTimerSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
  timerId: z.string().uuid("Timer invalido"),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().uuid("Projeto invalido"),
});
