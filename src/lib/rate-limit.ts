/**
 * Lightweight per-user rate limiting (in-memory token bucket).
 * Suitable for a single instance / private beta. For multi-instance
 * production, replace with Redis (see KNOWN_LIMITATIONS.md).
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  perMinute = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 30),
): { allowed: boolean; retryAfterSec: number } {
  if (!perMinute || perMinute <= 0) return { allowed: true, retryAfterSec: 0 };

  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: perMinute, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill proportionally.
  const elapsedMin = (now - bucket.lastRefill) / 60_000;
  bucket.tokens = Math.min(perMinute, bucket.tokens + elapsedMin * perMinute);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfterSec: 0 };
  }
  const retryAfterSec = Math.ceil((1 - bucket.tokens) / (perMinute / 60));
  return { allowed: false, retryAfterSec };
}

/** Periodically prune idle buckets (call from a long-lived process). */
export function pruneBuckets(maxAgeMs = 10 * 60_000): void {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (now - b.lastRefill > maxAgeMs) buckets.delete(key);
  }
}
