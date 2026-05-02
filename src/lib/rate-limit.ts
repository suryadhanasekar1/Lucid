/**
 * Per-IP token bucket rate limiter — in-memory.
 * Adequate for the hackathon. NOT for multi-instance prod (no shared store).
 */

type Bucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  ip: string,
  rpm: number,
  bucketKey = "default",
): RateLimitResult {
  const key = `${bucketKey}:${ip}`;
  const now = Date.now();
  const refillRate = rpm / 60_000; // tokens per ms
  const bucket = buckets.get(key) ?? { tokens: rpm, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(rpm, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
  }

  buckets.set(key, bucket);
  const needed = 1 - bucket.tokens;
  const retryMs = needed / refillRate;
  return {
    ok: false,
    remaining: 0,
    retryAfterSec: Math.ceil(retryMs / 1000),
  };
}

/** Pull the client IP from a Next.js Request, with sensible localhost fallback. */
export function ipFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "127.0.0.1";
}
