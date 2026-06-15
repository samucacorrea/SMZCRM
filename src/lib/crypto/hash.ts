import { createHash, timingSafeEqual } from "node:crypto";

export function hashSecret(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function verifySecret(value: string, hash: string) {
  const computed = hashSecret(value);
  return timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}
