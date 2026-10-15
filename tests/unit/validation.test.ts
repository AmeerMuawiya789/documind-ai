import { describe, it, expect } from "vitest";
import {
  chatRequestSchema,
  summarizeRequestSchema,
  extractRequestSchema,
  compareRequestSchema,
  renameDocumentSchema,
} from "@/lib/validation";

describe("chatRequestSchema", () => {
  const valid = {
    documentId: "123e4567-e89b-12d3-a456-426614174000",
    message: "What is this about?",
  };

  it("accepts a valid request", () => {
    expect(chatRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(chatRequestSchema.safeParse({ ...valid, message: "  " }).success).toBe(false);
  });

  it("rejects an overlong message", () => {
    expect(chatRequestSchema.safeParse({ ...valid, message: "x".repeat(4001) }).success).toBe(false);
  });

  it("rejects a non-UUID document id", () => {
    expect(chatRequestSchema.safeParse({ ...valid, documentId: "not-a-uuid" }).success).toBe(false);
  });

  it("accepts an optional conversation id", () => {
    expect(
      chatRequestSchema.safeParse({
        ...valid,
        conversationId: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(true);
  });
});

describe("summarizeRequestSchema", () => {
  it("accepts every documented summary kind", () => {
    const kinds = ["overview", "detailed", "bullets", "key-findings", "dates-names", "action-items", "executive"];
    for (const kind of kinds) {
      expect(
        summarizeRequestSchema.safeParse({
          documentId: "123e4567-e89b-12d3-a456-426614174000",
          kind,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects unknown kinds", () => {
    expect(
      summarizeRequestSchema.safeParse({
        documentId: "123e4567-e89b-12d3-a456-426614174000",
        kind: "sonnet",
      }).success,
    ).toBe(false);
  });
});

describe("extractRequestSchema", () => {
  const doc = { documentId: "123e4567-e89b-12d3-a456-426614174000" };

  it("accepts 1–20 fields", () => {
    expect(extractRequestSchema.safeParse({ ...doc, fields: ["Dates"] }).success).toBe(true);
    expect(
      extractRequestSchema.safeParse({ ...doc, fields: Array.from({ length: 20 }, (_, i) => `f${i}`) }).success,
    ).toBe(true);
  });

  it("rejects empty or too many fields", () => {
    expect(extractRequestSchema.safeParse({ ...doc, fields: [] }).success).toBe(false);
    expect(
      extractRequestSchema.safeParse({ ...doc, fields: Array.from({ length: 21 }, (_, i) => `f${i}`) }).success,
    ).toBe(false);
  });
});

describe("compareRequestSchema", () => {
  it("requires two UUIDs", () => {
    expect(
      compareRequestSchema.safeParse({
        documentIdA: "123e4567-e89b-12d3-a456-426614174000",
        documentIdB: "123e4567-e89b-12d3-a456-426614174001",
      }).success,
    ).toBe(true);
    expect(
      compareRequestSchema.safeParse({
        documentIdA: "nope",
        documentIdB: "123e4567-e89b-12d3-a456-426614174001",
      }).success,
    ).toBe(false);
  });
});

describe("renameDocumentSchema", () => {
  it("trims and bounds the name", () => {
    expect(renameDocumentSchema.safeParse({ fileName: "  report.pdf  " }).success).toBe(true);
    expect(renameDocumentSchema.safeParse({ fileName: "" }).success).toBe(false);
    expect(renameDocumentSchema.safeParse({ fileName: "x".repeat(121) }).success).toBe(false);
  });
});
