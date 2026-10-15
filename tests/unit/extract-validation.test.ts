import { describe, it, expect } from "vitest";
import { validateFile, ExtractionError } from "@/lib/documents/extract";

describe("validateFile", () => {
  it("accepts supported types within the size limit", () => {
    expect(() => validateFile("report.pdf", "application/pdf", 1024)).not.toThrow();
    expect(() =>
      validateFile("notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1024),
    ).not.toThrow();
    expect(() => validateFile("data.txt", "text/plain", 1024)).not.toThrow();
    expect(() => validateFile("data.md", "text/markdown", 100)).not.toThrow();
    expect(() => validateFile("data.csv", "text/csv", 100)).not.toThrow();
  });

  it("rejects unsupported extensions", () => {
    expect(() => validateFile("evil.exe", "application/octet-stream", 100)).toThrowError(ExtractionError);
    expect(() => validateFile("image.png", "image/png", 100)).toThrowError(ExtractionError);
    expect(() => validateFile("noextension", "application/octet-stream", 100)).toThrowError(ExtractionError);
  });

  it("rejects oversized files with a clear message", () => {
    const big = 21 * 1024 * 1024;
    try {
      validateFile("big.pdf", "application/pdf", big);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ExtractionError);
      expect((err as ExtractionError).code).toBe("too_large");
      expect((err as Error).message).toMatch(/too large/i);
    }
  });

  it("rejects empty files", () => {
    expect(() => validateFile("empty.pdf", "application/pdf", 0)).toThrowError(ExtractionError);
  });
});
