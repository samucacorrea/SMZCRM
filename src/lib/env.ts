import { z } from "zod";

const defaults = {
  APP_PORT: 3000,
  APP_HOST: "0.0.0.0",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "replace-with-long-random-secret-1234567890",
  POSTGRES_DB: "nucleocrm",
  POSTGRES_USER: "nucleocrm",
  POSTGRES_PASSWORD: "change-me-postgres",
  DATABASE_URL: "postgresql://nucleocrm:change-me-postgres@postgres:5432/nucleocrm",
  REDIS_PASSWORD: "change-me-redis",
  REDIS_URL: "redis://:change-me-redis@redis:6379",
  MINIO_ROOT_USER: "minioadmin",
  MINIO_ROOT_PASSWORD: "change-me-minio",
  MINIO_BUCKET: "uploads",
  S3_ENDPOINT: "http://minio:9000",
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY: "minioadmin",
  S3_SECRET_KEY: "change-me-minio",
  ENCRYPTION_KEY: "replace-with-32-byte-key-1234567890abcd",
  INBOUND_WEBHOOK_MAX_BYTES: 65536,
  INBOUND_WEBHOOK_RATE_LIMIT: 30,
  INBOUND_WEBHOOK_RATE_WINDOW_MS: 60000,
} as const;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_PORT: z.coerce.number().default(defaults.APP_PORT),
  APP_HOST: z.string().default(defaults.APP_HOST),
  NEXT_PUBLIC_APP_URL: z.string().url().default(defaults.NEXT_PUBLIC_APP_URL),
  BETTER_AUTH_URL: z.string().url().default(defaults.BETTER_AUTH_URL),
  BETTER_AUTH_SECRET: z.string().min(32).default(defaults.BETTER_AUTH_SECRET),
  DATABASE_URL: z.string().min(1).default(defaults.DATABASE_URL),
  REDIS_URL: z.string().min(1).default(defaults.REDIS_URL),
  REDIS_PASSWORD: z.string().min(1).default(defaults.REDIS_PASSWORD),
  POSTGRES_DB: z.string().min(1).default(defaults.POSTGRES_DB),
  POSTGRES_USER: z.string().min(1).default(defaults.POSTGRES_USER),
  POSTGRES_PASSWORD: z.string().min(1).default(defaults.POSTGRES_PASSWORD),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  ENCRYPTION_KEY: z.string().min(32).default(defaults.ENCRYPTION_KEY),
  MINIO_ROOT_USER: z.string().min(1).default(defaults.MINIO_ROOT_USER),
  MINIO_ROOT_PASSWORD: z.string().min(1).default(defaults.MINIO_ROOT_PASSWORD),
  MINIO_BUCKET: z.string().min(1).default(defaults.MINIO_BUCKET),
  S3_ENDPOINT: z.string().url().default(defaults.S3_ENDPOINT),
  S3_REGION: z.string().min(1).default(defaults.S3_REGION),
  S3_ACCESS_KEY: z.string().min(1).default(defaults.S3_ACCESS_KEY),
  S3_SECRET_KEY: z.string().min(1).default(defaults.S3_SECRET_KEY),
  INBOUND_WEBHOOK_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(defaults.INBOUND_WEBHOOK_MAX_BYTES),
  INBOUND_WEBHOOK_RATE_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(defaults.INBOUND_WEBHOOK_RATE_LIMIT),
  INBOUND_WEBHOOK_RATE_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(defaults.INBOUND_WEBHOOK_RATE_WINDOW_MS),
  S3_FORCE_PATH_STYLE: z
    .string()
    .transform((value) => value === "true")
    .default("true"),
  RUN_MIGRATIONS: z
    .string()
    .transform((value) => value === "true")
    .default("true"),
});

export const env = envSchema.parse({
  ...defaults,
  ...process.env,
});
