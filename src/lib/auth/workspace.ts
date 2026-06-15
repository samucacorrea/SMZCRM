import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  permissions,
  rolePermissions,
  roles,
  sessions,
  staffMembers,
  tenants,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_NAMES,
  DEFAULT_ROLE_PERMISSION_MAP,
} from "@/lib/rbac/defaults";
import { syncTenantLeadStages } from "@/modules/leads/bootstrap";

type SessionPayload = {
  session: {
    id: string;
    userId: string;
    activeTenantId?: string | null;
    activeStaffMemberId?: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
};

function slugifyWorkspace(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function ensureGlobalPermissions() {
  for (const permission of DEFAULT_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({
        id: createId(),
        ...permission,
      })
      .onConflictDoNothing();
  }
}

async function ensureTenantRoles(tenantId: string) {
  for (const roleName of DEFAULT_ROLE_NAMES) {
    await db
      .insert(roles)
      .values({
        id: createId(),
        tenantId,
        name: roleName,
        scope: "tenant",
        isSystem: roleName === "Admin",
      })
      .onConflictDoNothing();
  }
}

async function ensureRolePermissions(tenantId: string) {
  const tenantRoles = await db.query.roles.findMany({
    where: eq(roles.tenantId, tenantId),
  });
  const allPermissions = await db.query.permissions.findMany();

  for (const role of tenantRoles) {
    const allowedKeys = DEFAULT_ROLE_PERMISSION_MAP[
      role.name as keyof typeof DEFAULT_ROLE_PERMISSION_MAP
    ];

    if (!allowedKeys) {
      continue;
    }

    for (const permission of allPermissions) {
      const permissionKey = `${permission.moduleKey}.${permission.action}`;

      if (!allowedKeys.includes(permissionKey as never)) {
        continue;
      }

      await db
        .insert(rolePermissions)
        .values({
          tenantId,
          roleId: role.id,
          permissionId: permission.id,
        })
        .onConflictDoNothing();
    }
  }
}

export async function syncTenantAccessModel(tenantId: string) {
  await ensureGlobalPermissions();
  await ensureTenantRoles(tenantId);
  await ensureRolePermissions(tenantId);
  await syncTenantLeadStages(tenantId);
}

async function createWorkspaceForUser(user: SessionPayload["user"]) {
  const baseSlug = slugifyWorkspace(user.email.split("@")[0] || user.name) || "workspace";
  const tenantId = createId();
  const tenantSlug = `${baseSlug}-${tenantId.slice(-6)}`;

  await db.insert(tenants).values({
    id: tenantId,
    slug: tenantSlug,
    name: `${user.name} Workspace`,
  });

  await syncTenantAccessModel(tenantId);

  const adminRole = await db.query.roles.findFirst({
    where: and(eq(roles.tenantId, tenantId), eq(roles.name, "Admin")),
  });

  if (!adminRole) {
    throw new Error("Admin role bootstrap failed");
  }

  const staffMemberId = createId();
  await db.insert(staffMembers).values({
    id: staffMemberId,
    tenantId,
    userId: user.id,
    roleId: adminRole.id,
    displayName: user.name,
    status: "active",
  });

  return {
    tenantId,
    staffMemberId,
  };
}

export async function ensureSessionWorkspace(sessionPayload: SessionPayload) {
  const existingMembership = await db.query.staffMembers.findFirst({
    where: eq(staffMembers.userId, sessionPayload.user.id),
  });

  const workspace =
    existingMembership
      ? {
          tenantId: existingMembership.tenantId,
          staffMemberId: existingMembership.id,
        }
      : await createWorkspaceForUser(sessionPayload.user);

  await syncTenantAccessModel(workspace.tenantId);

  const needsSessionUpdate =
    sessionPayload.session.activeTenantId !== workspace.tenantId ||
    sessionPayload.session.activeStaffMemberId !== workspace.staffMemberId;

  if (needsSessionUpdate) {
    await db
      .update(sessions)
      .set({
        activeTenantId: workspace.tenantId,
        activeStaffMemberId: workspace.staffMemberId,
      })
      .where(eq(sessions.id, sessionPayload.session.id));
  }

  return workspace;
}
