import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { ensureSessionWorkspace } from "@/lib/auth/workspace";
import { db } from "@/lib/db";
import {
  permissions,
  rolePermissions,
  roles,
  staffMembers,
  sessions,
  tenants,
  users,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLE_NAMES } from "@/lib/rbac/defaults";

const DEFAULT_PASSWORD = "Admin@123456";
const DEFAULT_USER_EMAIL = "admin@demo.nucleocrm.local";
const DEFAULT_TENANT_SLUG = "demo";

export async function seed() {
  const existingTenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, DEFAULT_TENANT_SLUG),
  });

  const tenantId = existingTenant?.id ?? createId();

  if (!existingTenant) {
    await db.insert(tenants).values({
      id: tenantId,
      slug: DEFAULT_TENANT_SLUG,
      name: "Tenant Demo",
    });
  }

  for (const permission of DEFAULT_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({
        id: createId(),
        ...permission,
      })
      .onConflictDoNothing();
  }

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

  const adminRole = await db.query.roles.findFirst({
    where: and(eq(roles.tenantId, tenantId), eq(roles.name, "Admin")),
  });

  if (!adminRole) {
    throw new Error("Admin role was not created");
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, DEFAULT_USER_EMAIL),
  });

  const signUpResult =
    existingUser
      ? {
          user: existingUser,
        }
      : await auth.api.signUpEmail({
          body: {
            name: "Administrador Demo",
            email: DEFAULT_USER_EMAIL,
            password: DEFAULT_PASSWORD,
          },
        });

  const userId = signUpResult.user.id;

  await db
    .insert(staffMembers)
    .values({
      id: createId(),
      tenantId,
      userId,
      roleId: adminRole.id,
      displayName: "Administrador Demo",
      status: "active",
    })
    .onConflictDoNothing();

  const allPermissions = await db.query.permissions.findMany();

  for (const permission of allPermissions) {
    await db
      .insert(rolePermissions)
      .values({
        tenantId,
        roleId: adminRole.id,
        permissionId: permission.id,
      })
      .onConflictDoNothing();
  }

  const seededSession = await db.query.sessions.findFirst({
    where: eq(sessions.userId, userId),
  });

  if (seededSession) {
    await ensureSessionWorkspace({
      session: seededSession,
      user: signUpResult.user,
    });
  }
}

seed()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
