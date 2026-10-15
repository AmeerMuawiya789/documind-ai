import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkOperationLimit, checkDocumentLimit, trackUsage } from "@/lib/usage";

/** Minimal chainable mock of the Supabase query builder. */
function makeSupabase(opts: { tier?: string; usageCount?: number; docCount?: number } = {}) {
  const { tier = "free", usageCount = 0, docCount = 0 } = opts;
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {};
      chain.select = (_cols: string, selectOpts?: { count?: string }) => {
        (chain as { _count?: boolean })._count = Boolean(selectOpts?.count);
        return chain;
      };
      chain.eq = () => chain;
      chain.gte = () => chain;
      chain.single = async () => ({ data: { tier }, error: null });
      chain.insert = async () => ({ error: null });
      // Awaiting a count query resolves via .then
      (chain as { then: (r: (v: unknown) => void) => void }).then = (resolve) =>
        resolve({ count: table === "usage_events" ? usageCount : docCount, error: null });
      return chain;
    },
  } as unknown as SupabaseClient;
}

describe("checkOperationLimit", () => {
  it("never blocks questions — free tier is unlimited", async () => {
    const supabase = makeSupabase({ usageCount: 10_000 });
    const res = await checkOperationLimit(supabase, "user-1", "question");
    expect(res.allowed).toBe(true);
    expect(res.limit).toBe(Number.POSITIVE_INFINITY);
  });

  it("never blocks comparisons — free tier is unlimited", async () => {
    const supabase = makeSupabase({ usageCount: 0 });
    const res = await checkOperationLimit(supabase, "user-1", "comparison");
    expect(res.allowed).toBe(true);
  });

  it("never blocks summaries or extractions", async () => {
    const supabase = makeSupabase({ usageCount: 999_999 });
    for (const op of ["summary", "extraction"] as const) {
      const res = await checkOperationLimit(supabase, "user-1", op);
      expect(res.allowed).toBe(true);
    }
  });
});

describe("checkDocumentLimit", () => {
  it("never blocks uploads — document count is unlimited", async () => {
    const supabase = makeSupabase({ docCount: 500 });
    const res = await checkDocumentLimit(supabase, "user-1");
    expect(res.allowed).toBe(true);
  });
});

describe("trackUsage", () => {
  it("never throws — usage tracking must not break user flows", async () => {
    const supabase = makeSupabase();
    await expect(
      trackUsage(supabase, { userId: "user-1", operation: "question", inputTokens: 10, outputTokens: 20 }),
    ).resolves.toBeUndefined();
  });
});
