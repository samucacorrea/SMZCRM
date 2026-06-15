import { describe, expect, it } from "vitest";

import {
  flattenPayload,
  getValueAtPath,
  normalizePhoneToDigits,
} from "@/modules/webhooks/payload";

describe("webhook payload helpers", () => {
  it("flattens nested payloads", () => {
    expect(
      flattenPayload({
        lead: {
          name: "Maria",
          attribution: {
            utm_source: "meta",
          },
        },
      }),
    ).toEqual({
      "lead.name": "Maria",
      "lead.attribution.utm_source": "meta",
    });
  });

  it("reads values by path", () => {
    expect(
      getValueAtPath(
        {
          lead: {
            contact: {
              email: "maria@acme.com",
            },
          },
        },
        "lead.contact.email",
      ),
    ).toBe("maria@acme.com");
  });

  it("normalizes brazilian phone values", () => {
    expect(normalizePhoneToDigits("(11) 98888-7777")).toBe("+5511988887777");
  });
});
