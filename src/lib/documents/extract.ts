/**
 * Document text extraction (server-side only).
 * Supported: PDF (unpdf/pdf.js), DOCX (mammoth), TXT/MD/CSV.
 * Scanned-image PDFs are detected and reported honestly (OCR is optional).
 */

import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import type { PageText } from "@/lib/ai/chunking";

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
] as const;

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md", "csv"] as const;

export interface ExtractionResult {
  pages: PageText[];
  fullText: string;
  pageCount: number;
  charCount: number;
  /** True when the PDF has (almost) no embedded text — likely scanned. */
  likelyScanned: boolean;
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unsupported"
      | "encrypted"
      | "malformed"
      | "empty"
      | "too_large",
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export function validateFile(fileName: string, mimeType: string, sizeBytes: number) {
  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 20) * 1024 * 1024;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ExtractionError(
      `Unsupported file type ".${ext}". Supported: PDF, DOCX, TXT, MD, CSV.`,
      "unsupported",
    );
  }
  if (!(SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType) && mimeType !== "application/octet-stream") {
    // Allow octet-stream when the extension is valid (some browsers mislabel).
    throw new ExtractionError(`Unsupported file type "${mimeType}".`, "unsupported");
  }
  if (sizeBytes > maxBytes) {
    throw new ExtractionError(
      `File is too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB). Limit is ${maxBytes / 1024 / 1024} MB.`,
      "too_large",
    );
  }
  if (sizeBytes === 0) {
    throw new ExtractionError("The file is empty.", "empty");
  }
}

export async function extractDocumentText(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ExtractionResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  try {
    if (ext === "pdf") return await extractPdf(buffer);
    if (ext === "docx") return await extractDocx(buffer);
    return extractPlainText(buffer);
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    const message = err instanceof Error ? err.message : "Unknown error";
    if (/password|encrypt/i.test(message)) {
      throw new ExtractionError(
        "This PDF is encrypted or password-protected and cannot be processed.",
        "encrypted",
      );
    }
    throw new ExtractionError(
      "Could not read this file. It may be corrupted or malformed.",
      "malformed",
    );
  }
}

async function extractPdf(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  const pages: PageText[] = (Array.isArray(text) ? text : [text]).map(
    (t, i) => ({ pageNumber: i + 1, text: String(t ?? "") }),
  );
  const fullText = pages.map((p) => p.text).join("\n\n");
  const charCount = fullText.replace(/\s/g, "").length;
  return {
    pages,
    fullText,
    pageCount: pages.length,
    charCount: fullText.length,
    // Heuristic: a multi-page PDF with almost no text is probably scanned images.
    likelyScanned: pages.length > 0 && charCount / pages.length < 40,
  };
}

async function extractDocx(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const fullText = result.value ?? "";
  if (!fullText.trim()) {
    throw new ExtractionError("No readable text found in this document.", "empty");
  }
  return {
    pages: [{ pageNumber: 1, text: fullText }],
    fullText,
    pageCount: 1,
    charCount: fullText.length,
    likelyScanned: false,
  };
}

function extractPlainText(buffer: ArrayBuffer): ExtractionResult {
  const fullText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (!fullText.trim()) {
    throw new ExtractionError("No readable text found in this file.", "empty");
  }
  return {
    pages: [{ pageNumber: 1, text: fullText }],
    fullText,
    pageCount: 1,
    charCount: fullText.length,
    likelyScanned: false,
  };
}
