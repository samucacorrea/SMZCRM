import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { requiresMandatoryMfa, MFA_SETUP_PATH } from "@/lib/auth/mfa";
import { ensureSessionWorkspace } from "@/lib/auth/workspace";
import { PUBLIC_ROUTE_ALLOWLIST, PUBLIC_ROUTE_PREFIXES } from "@/lib/auth/public-routes";
import { db } from "@/lib/db";

const SUPER_ADMIN_PREFIX = "/super-admin";

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTE_ALLOWLIST.has(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isSuperAdminRoute(pathname: string) {
  return pathname === SUPER_ADMIN_PREFIX || pathname.startsWith(`${SUPER_ADMIN_PREFIX}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(loginUrl);
  }

  const isSuperAdmin = session.user.isSuperAdmin ?? false;

  if (isSuperAdminRoute(pathname)) {
    if (!isSuperAdmin) {
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }

    if (
      requiresMandatoryMfa({
        pathname,
        isSuperAdmin: true,
        twoFactorEnabled: session.user.twoFactorEnabled ?? undefined,
      })
    ) {
      return NextResponse.redirect(new URL(MFA_SETUP_PATH, request.url));
    }

    return NextResponse.next();
  }

  if (!isSuperAdmin) {
    await ensureSessionWorkspace(session);
  }

  const membership = !isSuperAdmin && session.session.activeStaffMemberId
    ? await db.query.staffMembers.findFirst({
        where: (table, { eq }) => eq(table.id, session.session.activeStaffMemberId ?? ""),
        with: {
          role: true,
        },
      })
    : null;

  if (
    requiresMandatoryMfa({
      pathname,
      roleName: membership?.role.name,
      isSuperAdmin,
      twoFactorEnabled: session.user.twoFactorEnabled ?? undefined,
    })
  ) {
    return NextResponse.redirect(new URL(MFA_SETUP_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
