import { describe, expect, it } from "vitest";

import { mapPayloadToLeadFields } from "@/modules/webhooks/inbound";

describe("webhook inbound mapping", () => {
  it("maps custom fields and keeps unmapped payload fields as extras", () => {
    const result = mapPayloadToLeadFields({
      payload: {
        name: "Mariana",
        phone: "(11) 99999-1111",
        campaign_id: "cmp_123",
        nested: {
          score: "98",
        },
      },
      unmappedPolicy: "store",
      mappings: [
        {
          sourceField: "campaign_id",
          targetType: "custom_field",
          targetKey: "campaign_id",
          transform: {},
        },
      ],
    });

    expect(result.leadFields.name).toBe("Mariana");
    expect(result.leadFields.phone).toBe("+5511999991111");
    expect(result.customData).toEqual({
      campaign_id: "cmp_123",
    });
    expect(result.extraData).toEqual({
      name: "Mariana",
      phone: "(11) 99999-1111",
      "nested.score": "98",
    });
  });

  it("ignores unmapped fields when policy is ignore and applies advanced transforms", () => {
    const result = mapPayloadToLeadFields({
      payload: {
        document: "123.456.789-00",
        zip: "01311-000",
        status: "novo",
        unused: "x",
      },
      unmappedPolicy: "ignore",
      mappings: [
        {
          sourceField: "document",
          targetType: "custom_field",
          targetKey: "cpf",
          transform: { type: "cpf_digits" },
        },
        {
          sourceField: "zip",
          targetType: "custom_field",
          targetKey: "cep",
          transform: { type: "cep_digits" },
        },
        {
          sourceField: "status",
          targetType: "lead_field",
          targetKey: "source",
          transform: { type: "conditional", value: "novo|Inbound|Outro" },
        },
      ],
    });

    expect(result.customData).toEqual({
      cpf: "12345678900",
      cep: "01311000",
    });
    expect(result.leadFields.source).toBe("Inbound");
    expect(result.extraData).toEqual({});
  });

  it("stores flattened extras for nested payloads when policy is store", () => {
    const result = mapPayloadToLeadFields({
      payload: {
        lead: {
          name: "Julia",
          custom_score: "87",
        },
        meta: {
          source: "instagram",
        },
      },
      unmappedPolicy: "store",
      mappings: [
        {
          sourceField: "lead.name",
          targetType: "lead_field",
          targetKey: "name",
          transform: {},
        },
      ],
    });

    expect(result.leadFields.name).toBe("Julia");
    expect(result.extraData).toEqual({
      "lead.custom_score": "87",
      "meta.source": "instagram",
    });
  });
});
