import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ensureSessionWorkspace } from "@/lib/auth/workspace";

export async function getRawServerSession() {
  try {
    const requestHeaders = await headers();
    return auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("Failed to read raw server session", error);
    return null;
  }
}

export async function getServerSession() {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session) {
      return null;
    }

    if (session.user.isSuperAdmin) {
      return session;
    }

    await ensureSessionWorkspace(session);

    return auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("Failed to hydrate server session", error);
    return null;
  }
}
