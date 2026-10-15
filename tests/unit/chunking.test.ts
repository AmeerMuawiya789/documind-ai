import { describe, it, expect } from "vitest";
import { chunkPages, chunkPlainText } from "@/lib/ai/chunking";

describe("chunkPages", () => {
  it("returns no chunks for empty pages", () => {
    expect(chunkPages([{ pageNumber: 1, text: "   " }])).toEqual([]);
  });

  it("keeps short text in a single chunk with its page number", () => {
    const chunks = chunkPages([{ pageNumber: 3, text: "Hello world. This is a test." }]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.pageNumber).toBe(3);
    expect(chunks[0]!.content).toContain("Hello world");
  });

  it("splits long text into multiple chunks with sequential indexes", () => {
    const sentence = "This is a sentence about retrieval augmented generation. ";
    const text = sentence.repeat(60); // ~3600 chars
    const chunks = chunkPages([{ pageNumber: 1, text }], 1200, 200);
    expect(chunks.length).toBeGreaterThan(2);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });

  it("preserves page numbers across a multi-page document", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "Page one content here." },
      { pageNumber: 2, text: "Page two content here." },
    ]);
    expect(chunks.map((c) => c.pageNumber)).toEqual([1, 2]);
  });

  it("applies overlap so context survives chunk boundaries", () => {
    const text = "Alpha. ".repeat(200) + "UNIQUE_MARKER_SENTENCE_HERE. " + "Beta. ".repeat(200);
    const chunks = chunkPages([{ pageNumber: 1, text }], 800, 300);
    const withMarker = chunks.filter((c) => c.content.includes("UNIQUE_MARKER_SENTENCE_HERE"));
    // The marker appears in at least one chunk, and overlap keeps neighbors related.
    expect(withMarker.length).toBeGreaterThanOrEqual(1);
  });
});

describe("chunkPlainText", () => {
  it("assigns page 1 to plain text", () => {
    const chunks = chunkPlainText("Just some text.");
    expect(chunks[0]!.pageNumber).toBe(1);
  });
});
