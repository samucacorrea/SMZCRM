import { describe, expect, it } from "vitest";

import { parseCustomerImportCsv } from "@/modules/customers/csv";

describe("parseCustomerImportCsv", () => {
  it("parses rows using the expected import template", () => {
    const csv = [
      "legalName,tradeName,taxId,contactName,email,phone,website,zipCode,addressLine1,addressLine2,neighborhood,city,state",
      "Acme LTDA,Acme,12345678000195,Maria,maria@acme.com,11999999999,https://acme.com,01001-000,Rua A,Sala 2,Centro,Sao Paulo,SP",
    ].join("\n");

    expect(parseCustomerImportCsv(csv)).toEqual([
      {
        legalName: "Acme LTDA",
        tradeName: "Acme",
        taxId: "12345678000195",
        contactName: "Maria",
        email: "maria@acme.com",
        phone: "11999999999",
        website: "https://acme.com",
        zipCode: "01001-000",
        addressLine1: "Rua A",
        addressLine2: "Sala 2",
        neighborhood: "Centro",
        city: "Sao Paulo",
        state: "SP",
      },
    ]);
  });

  it("supports quoted commas inside cells", () => {
    const csv = [
      "legalName,tradeName,taxId,contactName,email,phone,website,zipCode,addressLine1,addressLine2,neighborhood,city,state",
      "\"Silva, Pereira e Filhos\",SPF,11144477735,Joao,joao@spf.com,21999999999,,20000-000,Rua B,,Centro,Rio de Janeiro,RJ",
    ].join("\n");

    expect(parseCustomerImportCsv(csv)[0]?.legalName).toBe("Silva, Pereira e Filhos");
  });
});
