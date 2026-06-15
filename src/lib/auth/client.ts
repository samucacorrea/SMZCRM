import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

function resolveAuthBaseURL() {
  if (typeof window !== "undefined") {
    return new URL("/api/auth", window.location.origin).toString();
  }

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return new URL("/api/auth", candidate).toString();
    } catch {
      continue;
    }
  }

  return "http://localhost:3000/api/auth";
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
  ],
});
