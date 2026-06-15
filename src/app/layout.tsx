import "./globals.css";
import "@fontsource/inter/latin.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "NucleoCRM",
  description: "CRM SaaS multi-tenant brasileiro",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
