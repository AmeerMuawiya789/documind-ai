import { describe, it, expect } from "vitest";
import { getProvider, AIError, estimateCostUsd } from "@/lib/ai/provider";

describe("AIError", () => {
  it("carries an HTTP status", () => {
    const err = new AIError("boom", 503);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(503);
    expect(err.message).toBe("boom");
  });
});

describe("getProvider", () => {
  it("throws a friendly 503 when no AI key is configured", () => {
    // Deterministic only when the test env has no key and no mock flag.
    if (process.env.AI_API_KEY || process.env.DOCUMIND_MOCK_AI === "true") return;
    let caught: unknown = null;
    try {
      getProvider();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AIError);
    expect((caught as AIError).status).toBe(503);
    expect((caught as Error).message).toMatch(/not configured/i);
  });
});

describe("estimateCostUsd", () => {
  it("estimates cost from token counts", () => {
    // Defaults: $0.00015 / 1K input, $0.0006 / 1K output
    expect(estimateCostUsd(1000, 1000)).toBeCloseTo(0.00075, 8);
    expect(estimateCostUsd(0, 0)).toBe(0);
  });
});
