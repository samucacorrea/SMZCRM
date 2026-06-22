import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  createProjectTimeEntrySchema,
  createProjectTaskSchema,
  deleteProjectTimeEntrySchema,
  deleteProjectTaskSchema,
  deleteProjectSchema,
  startProjectTimerSchema,
  stopProjectTimerSchema,
  updateProjectStatusSchema,
  updateProjectTaskStatusSchema,
} from "@/modules/projects/validators";

describe("project validators", () => {
  it("accepts a valid project payload", () => {
    const result = createProjectSchema.safeParse({
      customerId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Gestão de Tráfego Q3",
      description: "Escopo de mídia, criativos e otimização semanal.",
      billingType: "fixed",
      status: "active",
      health: "healthy",
      currency: "BRL",
      rate: 250,
      budget: 8400,
      progress: 35,
      startDate: "2026-06-20T10:00",
      dueDate: "2026-08-30T10:00",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating a project snapshot", () => {
    const result = updateProjectStatusSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      status: "on_hold",
      health: "attention",
      progress: 60,
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a project", () => {
    const result = deleteProjectSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
    });

    expect(result.success).toBe(true);
  });

  it("accepts creating a project task", () => {
    const result = createProjectTaskSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      name: "Revisar cronograma semanal",
      description: "Validar entregas, risco e proximas acoes.",
      priority: "high",
      dueDate: "2026-07-05T15:00",
      assignedStaffMemberIds: [
        "019770f6-9c67-776d-aed2-d1775ff0dbf7",
        "019770f6-a111-776d-aed2-d1775ff0dbf8",
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts moving a project task across the board", () => {
    const result = updateProjectTaskStatusSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      taskId: "019770f6-a111-776d-aed2-d1775ff0dbf8",
      status: "in_progress",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a project task", () => {
    const result = deleteProjectTaskSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      taskId: "019770f6-a111-776d-aed2-d1775ff0dbf8",
    });

    expect(result.success).toBe(true);
  });

  it("accepts creating a project time entry", () => {
    const result = createProjectTimeEntrySchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      taskId: "019770f6-a111-776d-aed2-d1775ff0dbf8",
      staffId: "019770f6-b222-776d-aed2-d1775ff0dbf9",
      workedAt: "2026-07-06T14:00",
      durationMinutes: 95,
      billable: true,
      notes: "Sprint de criativos e aprovacao com cliente.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts deleting a project time entry", () => {
    const result = deleteProjectTimeEntrySchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      entryId: "019770f6-c333-776d-aed2-d1775ff0dbfa",
    });

    expect(result.success).toBe(true);
  });

  it("accepts starting a project timer", () => {
    const result = startProjectTimerSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      taskId: "019770f6-a111-776d-aed2-d1775ff0dbf8",
      staffId: "019770f6-b222-776d-aed2-d1775ff0dbf9",
      billable: true,
      notes: "Ajustes da sprint atual.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts stopping a project timer", () => {
    const result = stopProjectTimerSchema.safeParse({
      projectId: "019770f6-9c67-776d-aed2-d1775ff0dbf7",
      timerId: "019770f6-d444-776d-aed2-d1775ff0dbfb",
    });

    expect(result.success).toBe(true);
  });
});
