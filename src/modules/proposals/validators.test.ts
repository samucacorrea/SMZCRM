import { describe, expect, it } from "vitest";

import { acceptProposalByTokenSchema } from "@/modules/proposals/validators";

describe("proposal validators", () => {
  it("accepts a valid public acceptance payload", () => {
    const result = acceptProposalByTokenSchema.safeParse({
      publicToken: "abc1234567890token",
      signerName: "Mariana Costa",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a short token", () => {
    const result = acceptProposalByTokenSchema.safeParse({
      publicToken: "short",
      signerName: "Mariana Costa",
    });

    expect(result.success).toBe(false);
  });
});
