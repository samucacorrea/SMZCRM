import { describe, expect, it } from "vitest";

import {
  buildLeadActivityHistoryNote,
  buildLeadConversionSummaryNote,
} from "@/modules/leads/history";

describe("lead history helpers", () => {
  it("builds a conversion summary note", () => {
    const note = buildLeadConversionSummaryNote({
      leadId: "0197",
      leadName: "Mariana Costa",
      company: "Acme",
      source: "Meta Ads",
      stageName: "Qualificacao",
      estimatedValueInCents: 125000,
      tags: ["vip", "black-friday"],
      attribution: {
        utmSource: "meta",
        utmCampaign: "black-friday",
      },
    });

    expect(note).toContain("Cliente criado a partir da conversao de lead.");
    expect(note).toContain("Lead: Mariana Costa (0197)");
    expect(note).toContain("Valor estimado: R$ 1.250,00");
    expect(note).toContain("utmSource=meta");
  });

  it("builds a lead activity history note", () => {
    const note = buildLeadActivityHistoryNote({
      type: "note",
      actorName: "Samuel",
      body: "Cliente pediu retorno na sexta-feira.",
    });

    expect(note).toContain("Historico importado do lead.");
    expect(note).toContain("Tipo: note");
    expect(note).toContain("Autor: Samuel");
    expect(note).toContain("Cliente pediu retorno na sexta-feira.");
  });
});
