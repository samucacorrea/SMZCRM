import { describe, expect, it } from "vitest";

import { parseLeadImportCsv } from "@/modules/leads/csv";

describe("parseLeadImportCsv", () => {
  it("parses rows using the expected import template", () => {
    const csv = [
      "name,company,email,phone,source,stageName,estimatedValue,tags,description",
      "Maria,Acme,maria@acme.com,11999999999,Meta Ads,Entrada,1500,enterprise,Lead quente",
    ].join("\n");

    expect(parseLeadImportCsv(csv)).toEqual([
      {
        name: "Maria",
        company: "Acme",
        email: "maria@acme.com",
        phone: "11999999999",
        source: "Meta Ads",
        stageName: "Entrada",
        estimatedValue: "1500",
        tags: "enterprise",
        description: "Lead quente",
      },
    ]);
  });
});
