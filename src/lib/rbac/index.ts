import { db } from "@/lib/db";
import { permissionRoutes } from "@/lib/rbac/permissions";
import { ForbiddenError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant-context";

export type PermissionAction = "view" | "view_own" | "create" | "edit" | "delete";

export async function assertPermission(
  moduleKey: string,
  action: PermissionAction,
) {
  const tenantContext = await getTenantContext();

  const staffMember = await db.query.staffMembers.findFirst({
    where: (table, { eq }) => eq(table.id, tenantContext.staffMemberId),
    with: {
      role: {
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissionKey = permissionRoutes(moduleKey, action);
  const hasPermission = staffMember?.role.rolePermissions.some(
    ({ permission }) =>
      permission.moduleKey === permissionKey.moduleKey &&
      permission.action === permissionKey.action,
  );

  if (!hasPermission) {
    throw new ForbiddenError();
  }
}
