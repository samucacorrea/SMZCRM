import IORedis from "ioredis";

import { env } from "@/lib/env";

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on("error", () => {
  // Rate limiting and queues should not crash module evaluation when Redis is unavailable.
});

export const bullConnection = {
  host: "redis",
  port: 6379,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};
