import type { PermissionAction } from "@/lib/rbac";

export function permissionRoutes(moduleKey: string, action: PermissionAction) {
  return { moduleKey, action };
}
