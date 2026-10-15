import { describe, it, expect } from "vitest";
import { formatEvidence, type RetrievedPassage } from "@/lib/ai/retrieval";

describe("formatEvidence", () => {
  const passages: RetrievedPassage[] = [
    { chunkId: "a", content: "First passage", pageNumber: 2, chunkIndex: 0, score: 0.9 },
    { chunkId: "b", content: "Second passage", pageNumber: null, chunkIndex: 5, score: 0.7 },
  ];

  it("numbers passages starting at 1 with page info", () => {
    const out = formatEvidence(passages);
    expect(out).toContain("[1] (page 2) First passage");
    expect(out).toContain("[2] Second passage");
  });

  it("returns empty string for no passages", () => {
    expect(formatEvidence([])).toBe("");
  });
});
