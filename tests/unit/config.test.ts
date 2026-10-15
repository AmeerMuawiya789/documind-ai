import { describe, it, expect } from "vitest";
import { getTier, TIERS, AI_CONFIG, aiConfigured } from "@/lib/config";

describe("tiers", () => {
  it("defines a single free tier", () => {
    expect(TIERS.map((t) => t.id)).toEqual(["free"]);
  });

  it("free tier costs nothing", () => {
    expect(getTier("free").priceMonthlyUsd).toBe(0);
  });

  it("every feature is unlocked on the free tier", () => {
    const limits = getTier("free").limits;
    expect(limits.comparison).toBe(true);
    expect(limits.advancedSummaries).toBe(true);
  });

  it("all quotas are unlimited", () => {
    const limits = getTier("free").limits;
    expect(limits.maxDocuments).toBe(Number.POSITIVE_INFINITY);
    expect(limits.maxQuestionsPerMonth).toBe(Number.POSITIVE_INFINITY);
    expect(limits.maxSummariesPerMonth).toBe(Number.POSITIVE_INFINITY);
    expect(limits.maxComparisonsPerMonth).toBe(Number.POSITIVE_INFINITY);
    expect(limits.maxExtractionsPerMonth).toBe(Number.POSITIVE_INFINITY);
  });

  it("falls back to free for unknown tier ids", () => {
    expect(getTier("nope").id).toBe("free");
    expect(getTier(null).id).toBe("free");
  });

  it("upload size is still capped", () => {
    expect(getTier("free").limits.maxUploadMb).toBeGreaterThan(0);
  });
});
