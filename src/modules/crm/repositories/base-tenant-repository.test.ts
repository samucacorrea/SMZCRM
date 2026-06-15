import { describe, expect, it } from "vitest";

import { createTenantRepository, getTenantRecordOr404 } from "@/lib/db/repository";
import { NotFoundError } from "@/lib/errors";
import { auditLogs } from "@/lib/db/schema";

describe("cross-tenant access", () => {
  it("injects tenant_id on writes", () => {
    const repository = createTenantRepository(auditLogs, "tenant-a");

    expect(
      repository.withTenant({
        event: "entity.created",
        resourceType: "lead",
        payload: {},
      }),
    ).toMatchObject({
      tenantId: "tenant-a",
      event: "entity.created",
    });
  });

  it("returns 404 when tenant A requests tenant B record by id", async () => {
    await expect(
      getTenantRecordOr404("tenant-a", async () => ({
        id: "record-1",
        tenantId: "tenant-b",
      })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns 404 when the record does not exist", async () => {
    await expect(
      getTenantRecordOr404("tenant-a", async () => undefined),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
