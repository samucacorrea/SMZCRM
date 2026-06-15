import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";

const links = [
  { href: "/super-admin", label: "Dashboard" },
  { href: "/super-admin/tenants", label: "Tenants" },
  { href: "/super-admin/plans", label: "Planos" },
  { href: "/super-admin/monitoring", label: "Monitoramento" },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireSuperAdminSession();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              Super Admin
            </p>
            <h1 className="text-lg font-semibold">NúcleoCRM Control Plane</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <LogoutButton className="h-9" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-border bg-card p-3">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
