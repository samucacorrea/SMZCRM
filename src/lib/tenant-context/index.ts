import { cache } from "react";

import { getServerSession } from "@/lib/auth/session";
import { syncTenantAccessModel } from "@/lib/auth/workspace";
import { db } from "@/lib/db";
import { setTenantContext } from "@/lib/db/tenant";
import { NotFoundError } from "@/lib/errors";

export const getTenantContext = cache(async () => {
  const session = await getServerSession();
  const activeTenantId = session?.session.activeTenantId;
  const activeStaffMemberId = session?.session.activeStaffMemberId;

  if (!activeTenantId) {
    throw new NotFoundError("Active tenant not found in session");
  }

  const membership = await db.query.staffMembers.findFirst({
    where: (table, { eq, and }) =>
      and(
        eq(table.id, activeStaffMemberId ?? ""),
        eq(table.tenantId, activeTenantId),
      ),
  });

  if (!membership) {
    throw new NotFoundError("Staff member not found");
  }

  await syncTenantAccessModel(activeTenantId);
  await setTenantContext({
    tenantId: activeTenantId,
    staffMemberId: membership.id,
  });

  return {
    tenantId: activeTenantId,
    staffMemberId: membership.id,
    userId: membership.userId,
    roleId: membership.roleId,
  };
});
