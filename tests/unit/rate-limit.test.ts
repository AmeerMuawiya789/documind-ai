import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => vi.useRealTimers());

  it("allows requests within the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("test-user-1", 5).allowed).toBe(true);
    }
  });

  it("blocks requests over the limit and reports retry delay", () => {
    const key = "test-user-2";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3);
    const result = checkRateLimit(key, 3);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it("is disabled when the limit is 0", () => {
    expect(checkRateLimit("anyone", 0).allowed).toBe(true);
  });

  it("keeps buckets isolated per key", () => {
    for (let i = 0; i < 2; i++) checkRateLimit("user-a", 2);
    expect(checkRateLimit("user-a", 2).allowed).toBe(false);
    expect(checkRateLimit("user-b", 2).allowed).toBe(true);
  });
});
