import { and, eq } from "drizzle-orm";

import { NotFoundError } from "@/lib/errors";
import type { tenantScopedTables } from "@/lib/db/schema";

type TenantScopedTable = (typeof tenantScopedTables)[keyof typeof tenantScopedTables];
type InferSelect<T extends TenantScopedTable> = T["$inferSelect"];
type InferInsert<T extends TenantScopedTable> = T["$inferInsert"];

export function createTenantRepository<T extends TenantScopedTable>(
  table: T,
  tenantId: string,
) {
  return {
    table,
    tenantId,
    withTenant(data: Omit<InferInsert<T>, "tenantId">): InferInsert<T> {
      return { ...data, tenantId } as InferInsert<T>;
    },
    matchById(id: string) {
      return and(eq(table.id, id), eq(table.tenantId, tenantId));
    },
  };
}

export function assertTenantRecord<T extends { tenantId: string }>(
  record: T | undefined,
  tenantId: string,
) {
  if (!record || record.tenantId !== tenantId) {
    throw new NotFoundError();
  }

  return record;
}

export async function getTenantRecordOr404<T extends { id: string; tenantId: string }>(
  tenantId: string,
  lookup: () => Promise<T | undefined>,
) {
  const record = await lookup();
  return assertTenantRecord(record, tenantId);
}
