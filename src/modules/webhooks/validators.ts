import { z } from "zod";

export const createInboundWebhookSchema = z.object({
  name: z.string().min(3, "Nome obrigatorio"),
  defaultStageId: z.string().uuid("Estagio invalido"),
  defaultSource: z.string().min(2, "Origem padrao obrigatoria"),
  autoTags: z.string().optional(),
  dedupKey: z.enum(["email", "phone", "none"]),
  dedupAction: z.enum(["create", "update", "note"]),
});

export const testInboundWebhookPayloadSchema = z.object({
  payload: z.string().min(2, "Informe um payload JSON valido."),
});

export const createWebhookMappingSchema = z.object({
  sourceField: z.string().min(1, "Campo de origem obrigatorio"),
  targetType: z.enum(["lead_field", "attribution_field", "custom_field"]),
  targetKey: z.string().min(1, "Destino obrigatorio"),
  transformType: z.enum([
    "none",
    "phone_e164",
    "lowercase",
    "uppercase",
    "titlecase",
    "cpf_digits",
    "cep_digits",
    "date_iso",
    "fixed",
    "conditional",
  ]),
  transformValue: z.string().optional(),
});

export const createWebhookCustomFieldSchema = z.object({
  label: z.string().min(2, "Nome do campo obrigatorio"),
  key: z
    .string()
    .min(2, "Chave obrigatoria")
    .regex(/^[a-z][a-z0-9_]*$/, "Use apenas letras minusculas, numeros e underscore."),
  dataType: z.enum(["text", "number", "date", "boolean"]),
});

export const updateInboundWebhookSchema = z.object({
  name: z.string().min(3, "Nome obrigatorio"),
  defaultStageId: z.string().uuid("Estagio invalido"),
  defaultSource: z.string().min(2, "Origem padrao obrigatoria"),
  defaultOwnerId: z.string().uuid("Responsavel invalido").optional().or(z.literal("")),
  autoTags: z.string().optional(),
  dedupKey: z.enum(["email", "phone", "none"]),
  dedupAction: z.enum(["create", "update", "note"]),
  unmappedPolicy: z.enum(["ignore", "store", "notify"]),
  status: z.enum(["active", "paused"]),
  requireEmailOrPhone: z.enum(["true", "false"]),
  createCustomerOnLeadCreate: z.enum(["true", "false"]),
});
