import { describe, expect, it } from "vitest";

import { parseCustomerImportCsv } from "@/modules/customers/csv";

describe("parseCustomerImportCsv", () => {
  it("parses rows using the expected import template", () => {
    const csv = [
      "legalName,tradeName,taxId,contactName,email,phone,website,city,state",
      "Acme LTDA,Acme,12345678000199,Maria,maria@acme.com,11999999999,https://acme.com,Sao Paulo,SP",
    ].join("\n");

    expect(parseCustomerImportCsv(csv)).toEqual([
      {
        legalName: "Acme LTDA",
        tradeName: "Acme",
        taxId: "12345678000199",
        contactName: "Maria",
        email: "maria@acme.com",
        phone: "11999999999",
        website: "https://acme.com",
        city: "Sao Paulo",
        state: "SP",
      },
    ]);
  });

  it("supports quoted commas inside cells", () => {
    const csv = [
      "legalName,tradeName,taxId,contactName,email,phone,website,city,state",
      "\"Silva, Pereira e Filhos\",SPF,12345678901,Joao,joao@spf.com,21999999999,,Rio de Janeiro,RJ",
    ].join("\n");

    expect(parseCustomerImportCsv(csv)[0]?.legalName).toBe("Silva, Pereira e Filhos");
  });
});
