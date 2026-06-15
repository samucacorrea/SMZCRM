import { redis } from "@/lib/queue";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function assertRateLimit(config: RateLimitConfig) {
  const namespacedKey = `rate-limit:${config.key}`;
  const count = await redis.incr(namespacedKey);

  if (count === 1) {
    await redis.pexpire(namespacedKey, config.windowMs);
  }

  const ttlMs = await redis.pttl(namespacedKey);

  return {
    success: count <= config.limit,
    count,
    retryAfterMs: ttlMs > 0 ? ttlMs : config.windowMs,
  };
}
