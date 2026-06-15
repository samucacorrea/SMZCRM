"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
};

export function LogoutButton({
  className,
  variant = "outline",
}: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button className={className} type="button" variant={variant} onClick={handleLogout}>
      Sair
    </Button>
  );
}
