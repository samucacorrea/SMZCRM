import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import type { pool } from "@/lib/db";

export type TenantContext = {
  tenantId: string;
  staffMemberId?: string | null;
};

export async function setTenantContext(context: TenantContext) {
  await db.execute(
    sql`select set_config('app.current_tenant_id', ${context.tenantId}, true)`,
  );

  if (context.staffMemberId) {
    await db.execute(
      sql`select set_config('app.current_staff_member_id', ${context.staffMemberId}, true)`,
    );
  }
}

export async function withTenantContext<T>(
  context: TenantContext,
  callback: () => Promise<T>,
) {
  await setTenantContext(context);
  return callback();
}
