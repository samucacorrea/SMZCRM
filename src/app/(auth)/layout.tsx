import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_#f7f9fc,_#edf1f6)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="hidden rounded-[28px] bg-sidebar p-10 text-white shadow-card lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-white/40">
              NúcleoCRM
            </p>
            <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight">
              Fundação segura para operação multi-tenant brasileira.
            </h1>
          </div>
          <div className="grid gap-3 text-sm text-white/72">
            <p>RLS por tenant</p>
            <p>RBAC server-first</p>
            <p>MFA com TOTP</p>
          </div>
        </div>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
}
