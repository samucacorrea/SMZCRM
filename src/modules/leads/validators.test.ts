import { describe, expect, it } from "vitest";

import {
  createLeadNoteSchema,
  createLeadSchema,
  importLeadRowSchema,
  moveLeadStageSchema,
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
