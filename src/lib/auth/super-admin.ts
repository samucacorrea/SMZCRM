import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";
import { getRawServerSession } from "@/lib/auth/session";

export async function requireSuperAdminSession() {
  const session = await getRawServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, session.user.id),
  });

  if (!user?.isSuperAdmin) {
    throw new ForbiddenError();
  }

  return {
    session,
    user,
  };
}
