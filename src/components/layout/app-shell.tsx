"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  hint: string;
};

const sections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "CRM",
    items: [
      { href: "/dashboard", label: "Visão geral", hint: "00" },
      { href: "/customers", label: "Clientes", hint: "11" },
      { href: "/leads", label: "Leads", hint: "14" },
      { href: "/leads/kanban", label: "Kanban", hint: "KB" },
      { href: "/projects", label: "Projetos", hint: "PJ" },
      { href: "/timesheets", label: "Timesheets", hint: "TS" },
      { href: "/billing", label: "Faturas", hint: "R$" },
      { href: "/webhooks", label: "Webhooks", hint: "IN" },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "#", label: "Fila", hint: "Q" },
      { href: "#", label: "Atendimento", hint: "WA" },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "#", label: "Equipe", hint: "IAM" },
      { href: "#", label: "Permissões", hint: "RBAC" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentSection =
    pathname.startsWith("/customers")
      ? "Clientes"
      : pathname.startsWith("/leads")
        ? "Leads"
        : pathname.startsWith("/projects")
          ? "Projetos"
        : pathname.startsWith("/timesheets")
          ? "Timesheets"
        : pathname.startsWith("/billing")
          ? "Faturas"
        : pathname.startsWith("/dashboard")
          ? "Visão geral"
          : "Workspace";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="w-sidebar shrink-0 border-r border-white/5 bg-sidebar px-4 py-5 text-sidebar-foreground">
          <div className="mb-8 border-b border-white/5 pb-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              NúcleoCRM
            </p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight">Precision CRM</h1>
            <p className="mt-1 text-xs text-white/45">Stack operacional multi-tenant</p>
          </div>

          <nav className="space-y-6">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      item.href !== "#" &&
                      (pathname === item.href || pathname.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/72 transition hover:bg-white/5 hover:text-white",
                          isActive && "bg-sidebar-active text-white",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-6 min-w-6 items-center justify-center rounded-md bg-white/5 px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55",
                              isActive && "bg-primary text-primary-foreground",
                            )}
                          >
                            {item.hint}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full bg-transparent transition",
                            isActive && "bg-primary",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-topbar items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Workspace
                </p>
                <p className="text-sm font-medium">Tenant Demo</p>
              </div>
              <div className="hidden h-7 w-px bg-border md:block" />
              <div className="hidden md:block">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Área atual
                </p>
                <p className="text-sm font-medium text-foreground">{currentSection}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden min-w-[240px] items-center rounded-lg border border-border bg-background px-3 py-2 md:flex">
                <span className="mr-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Busca
                </span>
                <span className="text-sm text-muted-foreground">Módulos, clientes, leads...</span>
              </div>
              <LogoutButton className="h-9" />
            </div>
          </header>
          <main className="flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(240,242,245,0.9)_100%)] p-[18px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
