/**
 * Central, environment-driven configuration.
 * DocuMind AI is free forever: a single tier with every feature unlocked
 * and no usage caps. Quotas are still tracked for transparency, but they
 * never block.
 */

export type TierId = "free" | "pro" | "business";

export interface TierConfig {
  id: TierId;
  name: string;
  priceMonthlyUsd: number;
  tagline: string;
  features: string[];
  limits: {
    maxDocuments: number;
    maxQuestionsPerMonth: number;
    maxSummariesPerMonth: number;
    maxComparisonsPerMonth: number;
    maxExtractionsPerMonth: number;
    maxUploadMb: number;
    advancedSummaries: boolean;
    comparison: boolean;
  };
  cta: string;
  highlighted?: boolean;
}

function num(env: string | undefined, fallback: number): number {
  const v = Number(env);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const TIERS: TierConfig[] = [
  {
    id: "free",
    name: "Free",
    priceMonthlyUsd: 0,
    tagline: "Every feature, unlimited — free forever.",
    features: [
      "Unlimited documents",
      "Unlimited AI questions",
      "Advanced summaries (executive, key findings…)",
      "Document comparison",
      "Structured data extraction",
      "PDF, TXT & DOCX uploads",
    ],
    limits: {
      maxDocuments: Number.POSITIVE_INFINITY,
      maxQuestionsPerMonth: Number.POSITIVE_INFINITY,
      maxSummariesPerMonth: Number.POSITIVE_INFINITY,
      maxComparisonsPerMonth: Number.POSITIVE_INFINITY,
      maxExtractionsPerMonth: Number.POSITIVE_INFINITY,
      maxUploadMb: num(process.env.MAX_UPLOAD_MB, 20),
      advancedSummaries: true,
      comparison: true,
    },
    cta: "Start for free",
  },
];

export function getTier(id: string | null | undefined): TierConfig {
  return TIERS.find((t) => t.id === id) ?? TIERS[0]!;
}

export const APP_NAME = "DocuMind AI";
export const SUPPORT_EMAIL = "support@documind.ai";

export const AI_CONFIG = {
  baseUrl: process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1",
  apiKey: process.env.AI_API_KEY ?? "",
  chatModel: process.env.AI_CHAT_MODEL ?? "gpt-4o-mini",
  embeddingModel: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  embeddingDimensions: num(process.env.AI_EMBEDDING_DIMENSIONS, 1536),
  mock: process.env.DOCUMIND_MOCK_AI === "true",
  maxInputChars: 120_000,
  requestTimeoutMs: 60_000,
  maxRetries: 2,
};

export function aiConfigured(): boolean {
  return AI_CONFIG.mock || AI_CONFIG.apiKey.length > 0;
}
