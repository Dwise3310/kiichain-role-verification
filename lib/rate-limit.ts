import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const ratelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(8, "60 s"),
      analytics: true,
      prefix: "kii-verify",
    })
  : null;

// In-memory fallback so local dev / demos work without Upstash configured.
// NOT suitable for a real multi-instance production deployment — set
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN before going live.
const memoryStore = new Map<string, { count: number; reset: number }>();

export async function checkRateLimit(key: string): Promise<{ success: boolean; remaining: number }> {
  if (ratelimit) {
    const { success, remaining } = await ratelimit.limit(key);
    return { success, remaining };
  }

  const windowMs = 60_000;
  const limit = 8;
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.reset < now) {
    memoryStore.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  entry.count += 1;
  const success = entry.count <= limit;
  return { success, remaining: Math.max(0, limit - entry.count) };
}

/** Pulls a best-effort client identifier from request headers for rate limiting/hashing. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
