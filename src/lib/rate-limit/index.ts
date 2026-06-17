import { redis } from "@/lib/queue";
import { logWarn } from "@/lib/logger";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

const REDIS_RATE_LIMIT_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`rate limit timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export async function assertRateLimit(config: RateLimitConfig) {
  try {
    const namespacedKey = `rate-limit:${config.key}`;
    const count = await withTimeout(redis.incr(namespacedKey), REDIS_RATE_LIMIT_TIMEOUT_MS);

    if (count === 1) {
      await withTimeout(redis.pexpire(namespacedKey, config.windowMs), REDIS_RATE_LIMIT_TIMEOUT_MS);
    }

    const ttlMs = await withTimeout(redis.pttl(namespacedKey), REDIS_RATE_LIMIT_TIMEOUT_MS);

    return {
      success: count <= config.limit,
      count,
      retryAfterMs: ttlMs > 0 ? ttlMs : config.windowMs,
    };
  } catch (error) {
    logWarn("rate_limit.redis_unavailable", {
      key: config.key,
      limit: config.limit,
      windowMs: config.windowMs,
      reason: error instanceof Error ? error.message : String(error),
    });

    // Fail open: webhook ingestion must keep responding even if Redis is degraded.
    return {
      success: true,
      count: 0,
      retryAfterMs: 0,
    };
  }
}
