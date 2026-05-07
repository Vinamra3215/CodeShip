import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const globalForRedis = globalThis as typeof globalThis & { redis?: Redis };

const redis: Redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Generic cache-through wrapper.
 *
 * 1. Check Redis for `key`
 * 2. If cache hit → parse & return
 * 3. If cache miss → call `fn()`, store result with TTL, return
 *
 * @param key   Redis key
 * @param ttl   Time-to-live in seconds
 * @param fn    Async function to compute the value on cache miss
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis down → fall through to fn()
  }

  const result = await fn();

  try {
    await redis.set(key, JSON.stringify(result), "EX", ttl);
  } catch {
    // Redis down → silently ignore
  }

  return result;
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Redis down → silently ignore
  }
}

/**
 * Invalidate all keys matching a pattern (e.g. "dashboard:*").
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis down → silently ignore
  }
}

export default redis;
