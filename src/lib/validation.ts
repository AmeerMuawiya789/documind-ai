import { z } from "zod";

/** Shared validation — every API route validates input server-side. */

export const uuidSchema = z.string().uuid("Invalid id");

export const chatRequestSchema = z.object({
  documentId: uuidSchema,
  conversationId: uuidSchema.optional(),
  message: z
    .string()
    .trim()
    .min(1, "Message is empty")
    .max(4000, "Message is too long (max 4000 characters)"),
});

export const summaryKindSchema = z.enum([
  "overview",
  "detailed",
  "bullets",
  "key-findings",
  "dates-names",
  "action-items",
  "executive",
]);

export const summarizeRequestSchema = z.object({
  documentId: uuidSchema,
  kind: summaryKindSchema,
});

export const extractRequestSchema = z.object({
  documentId: uuidSchema,
  fields: z
    .array(z.string().trim().min(1).max(80))
    .min(1, "Choose at least one field")
    .max(20, "Too many fields (max 20)"),
});

export const compareRequestSchema = z.object({
  documentIdA: uuidSchema,
  documentIdB: uuidSchema,
});

export const renameDocumentSchema = z.object({
  fileName: z.string().trim().min(1).max(120),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
