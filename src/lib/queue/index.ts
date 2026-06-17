import IORedis from "ioredis";

import { env } from "@/lib/env";

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 10000,
});

redis.on("error", () => {
  // Rate limiting and queues should not crash module evaluation when Redis is unavailable.
});

const redisConnectionUrl = new URL(env.REDIS_URL);
const redisPort = redisConnectionUrl.port
  ? Number.parseInt(redisConnectionUrl.port, 10)
  : 6379;

export const bullConnection = {
  host: redisConnectionUrl.hostname,
  port: redisPort,
  username: redisConnectionUrl.username || undefined,
  password: redisConnectionUrl.password || env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};
