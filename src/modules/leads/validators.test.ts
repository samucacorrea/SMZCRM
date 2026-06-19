import { describe, expect, it } from "vitest";

import {
  bulkAssignLeadOwnerSchema,
  bulkDeleteLeadsSchema,
  bulkMoveLeadsStageSchema,
  bulkQualifyLeadsSchema,
  bulkUpdateLeadTagsSchema,
  closeWonLeadSchema,
  completeLeadReminderSchema,
  createLeadNoteSchema,
  createLeadReminderSchema,
  createLeadProposalSchema,
  createLeadTaskSchema,
  createLeadFollowUpSchema,
  createLeadSchema,
  deleteLeadAttachmentSchema,
  deleteLeadFollowUpSchema,
  deleteLeadReminderSchema,
  deleteLeadProposalSchema,
  deleteLeadTaskSchema,
  importLeadRowSchema,
  markLeadLostSchema,
  moveLeadStageSchema,
  qualifyLeadSchema,
  updateLeadDetailsSchema,
  updateLeadProposalStatusSchema,
  updateLeadTaskStatusSchema,
} from "@/modules/leads/validators";

describe("lead validators", () => {
  it("accepts a valid lead payload", () => {
    const result = createLeadSchema.safeParse({
      name: "Maria Oliveira",
      company: "Acme",
      email: "maria@acme.com",
      phone: "11999999999",
      source: "Inbound",
      stageId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      estimatedValue: 1500,
      tags: "enterprise,quente",
      description: "Lead com alta aderencia.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating core lead details", () => {
    const result = updateLeadDetailsSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Maria Oliveira",
      company: "Acme",
      email: "maria@acme.com",
      phone: "11999999999",
      source: "Inbound",
      estimatedValue: 3200,
      tags: "quente, enterprise",
      description: "Lead atualizado pelo executivo.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid stage movement", () => {
    const result = moveLeadStageSchema.safeParse({
      leadId: "123",
      stageId: "456",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty notes", () => {
    const result = createLeadNoteSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      body: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid reminder payload", () => {
    const result = createLeadReminderSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      description: "Ligar amanhã para revisar proposta.",
      remindAt: "2026-06-20T10:30",
      notifyCustomer: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty reminder description", () => {
    const result = createLeadReminderSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      description: "",
      remindAt: "2026-06-20T10:30",
      notifyCustomer: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts completing a reminder", () => {
    const result = completeLeadReminderSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      reminderId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a reminder", () => {
    const result = deleteLeadReminderSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      reminderId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid lead task payload", () => {
    const result = createLeadTaskSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Montar proposta comercial",
      description: "Versão inicial para enviar ao lead.",
      priority: "high",
      dueDate: "2026-06-20T15:00",
      assignedStaffMemberIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
        "019770f6-9c67-776d-aed2-d1775ff0dbf9",
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a task without assignees", () => {
    const result = createLeadTaskSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Montar proposta comercial",
      description: "",
      priority: "medium",
      dueDate: "2026-06-20T15:00",
      assignedStaffMemberIds: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts updating task status", () => {
    const result = updateLeadTaskStatusSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      taskId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      status: "done",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a lead task", () => {
    const result = deleteLeadTaskSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      taskId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid lead proposal payload", () => {
    const result = createLeadProposalSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      title: "Proposta de gestao de trafego",
      validUntil: "2026-06-30T12:00",
      notes: "Pagamento em duas parcelas.",
      items: [
        { description: "Setup inicial", quantity: 1, unitPrice: 2500 },
        { description: "Gestao mensal", quantity: 2, unitPrice: 1800 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a proposal without items", () => {
    const result = createLeadProposalSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      title: "Proposta vazia",
      validUntil: "2026-06-30T12:00",
      notes: "",
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts updating proposal status", () => {
    const result = updateLeadProposalStatusSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      proposalId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      status: "sent",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a proposal", () => {
    const result = deleteLeadProposalSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      proposalId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting an attachment", () => {
    const result = deleteLeadAttachmentSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      attachmentId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid follow-up payload", () => {
    const result = createLeadFollowUpSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      channel: "whatsapp",
      outcome: "interested",
      happenedAt: "2026-06-19T14:30",
      summary: "Lead respondeu e pediu detalhamento da proposta.",
      nextAction: "Enviar versão revisada até amanhã.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a follow-up", () => {
    const result = deleteLeadFollowUpSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      followUpId: "019770f6-9c67-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts qualifying a lead", () => {
    const result = qualifyLeadSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
    });

    expect(result.success).toBe(true);
  });

  it("accepts closing a lead as won", () => {
    const result = closeWonLeadSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      saleValue: 2500,
      currency: "BRL",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting leads in bulk", () => {
    const result = bulkDeleteLeadsSchema.safeParse({
      leadIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts moving leads stage in bulk", () => {
    const result = bulkMoveLeadsStageSchema.safeParse({
      leadIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      ],
      stageId: "019770f6-9c67-776d-aed2-d1775ff0dbf9",
    });

    expect(result.success).toBe(true);
  });

  it("accepts assigning owner in bulk", () => {
    const result = bulkAssignLeadOwnerSchema.safeParse({
      leadIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      ],
      assignedStaffMemberId: "019770f6-9c67-776d-aed2-d1775ff0dbf9",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating tags in bulk", () => {
    const result = bulkUpdateLeadTagsSchema.safeParse({
      leadIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      ],
      tags: "vip, black-friday",
    });

    expect(result.success).toBe(true);
  });

  it("accepts qualifying leads in bulk", () => {
    const result = bulkQualifyLeadsSchema.safeParse({
      leadIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      ],
      qualification: "qualified",
      reason: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects bulk lost without reason", () => {
    const result = bulkQualifyLeadsSchema.safeParse({
      leadIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-9c67-776d-aed2-d1775ff0dbf8",
      ],
      qualification: "lost",
      reason: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects lost lead without reason", () => {
    const result = markLeadLostSchema.safeParse({
      leadId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      reason: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid import row", () => {
    const result = importLeadRowSchema.safeParse({
      name: "Maria Oliveira",
      company: "Acme",
      email: "maria@acme.com",
      phone: "11999999999",
      source: "Inbound",
      stageName: "Entrada",
      estimatedValue: "1200",
      tags: "enterprise",
      description: "",
    });

    expect(result.success).toBe(true);
  });
});
