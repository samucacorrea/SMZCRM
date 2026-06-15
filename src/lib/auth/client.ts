import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

const browserBaseURL =
  typeof window !== "undefined"
    ? new URL("/api/auth", window.location.origin).toString()
    : null;

const authBaseURL =
  browserBaseURL ??
  new URL(
    "/api/auth",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ).toString();

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
  ],
});
