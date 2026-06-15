import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { hash, verify } from "@node-rs/argon2";

import { db } from "@/lib/db";
import { authSchema } from "@/lib/db/schema";
import { env } from "@/lib/env";

const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  appName: "NucleoCRM",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    password: {
      hash: (password) =>
        hash(password, {
          algorithm: 2,
          memoryCost: 19_456,
          timeCost: 2,
          parallelism: 1,
        }),
      verify: ({ hash: hashedPassword, password }) =>
        verify(hashedPassword, password, {
          algorithm: 2,
        }),
    },
  },
  socialProviders,
  user: {
    modelName: "user",
    additionalFields: {
      isSuperAdmin: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
    },
  },
  session: {
    modelName: "session",
    additionalFields: {
      activeTenantId: {
        type: "string",
        required: false,
      },
      activeStaffMemberId: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: "NucleoCRM",
    }),
  ],
});
