"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

export function Lightbox({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 bg-[rgba(15,17,23,0.32)] backdrop-blur-md"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-[101] w-full max-w-4xl rounded-[20px] border border-white/60 bg-card shadow-[0_24px_80px_rgba(15,17,23,0.18)]",
          className,
        )}
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cadastro
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <button
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              Fechar
            </button>
          </div>
        </div>
        <div className="max-h-[85vh] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
