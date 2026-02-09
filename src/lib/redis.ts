import { Redis } from "@upstash/redis";

/**
 * Shared Redis singleton for the newsletter builder.
 * Uses Upstash Redis (same instance as the news brief generator).
 * Keys are namespaced with "nl:" to avoid collisions.
 *
 * Supports both naming conventions:
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (SDK default)
 *   KV_REST_API_URL / KV_REST_API_TOKEN                (Vercel KV)
 */

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      throw new Error("Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}
