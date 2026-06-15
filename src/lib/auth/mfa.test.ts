import { describe, expect, it } from "vitest";

import { requiresMandatoryMfa } from "@/lib/auth/mfa";

describe("requiresMandatoryMfa", () => {
  it("requires MFA for admins without TOTP", () => {
    expect(
      requiresMandatoryMfa({
        pathname: "/dashboard",
        roleName: "Admin",
        twoFactorEnabled: false,
      }),
    ).toBe(true);
  });

  it("does not require MFA on the setup page itself", () => {
    expect(
      requiresMandatoryMfa({
        pathname: "/mfa/setup",
        roleName: "Admin",
        twoFactorEnabled: false,
      }),
    ).toBe(false);
  });

  it("does not require MFA for non-admin roles", () => {
    expect(
      requiresMandatoryMfa({
        pathname: "/dashboard",
        roleName: "Vendedor",
        twoFactorEnabled: false,
      }),
    ).toBe(false);
  });

  it("does not require MFA after activation", () => {
    expect(
      requiresMandatoryMfa({
        pathname: "/dashboard",
        roleName: "Admin",
        twoFactorEnabled: true,
      }),
    ).toBe(false);
  });

  it("requires MFA for super admin without TOTP", () => {
    expect(
      requiresMandatoryMfa({
        pathname: "/super-admin",
        isSuperAdmin: true,
        twoFactorEnabled: false,
      }),
    ).toBe(true);
  });
});
