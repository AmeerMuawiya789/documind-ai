/**
 * Usage tracking + tier limit enforcement (server-side only).
 * Every AI operation records a usage_events row; limits come from
 * the tier config so pricing stays configurable.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getTier, type TierId } from "@/lib/config";
import { estimateCostUsd } from "@/lib/ai/provider";

export type UsageOperation = "upload" | "question" | "summary" | "extraction" | "comparison";

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<TierId> {
  const { data } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();
  const tier = (data as { tier?: string } | null)?.tier;
  return tier === "pro" || tier === "business" ? tier : "free";
}

/** Count of an operation since the start of the current calendar month (UTC). */
export async function countMonthlyUsage(
  supabase: SupabaseClient,
  userId: string,
  operation: UsageOperation,
): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("operation", operation)
    .gte("created_at", start.toISOString());
  if (error) throw new Error("Could not check usage limits.");
  return count ?? 0;
}

export async function countDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error("Could not check document limits.");
  return count ?? 0;
}

export interface LimitCheck {
  allowed: boolean;
  reason?: string;
  used: number;
  limit: number;
}

/** Enforce the tier limit for one AI operation. Call before doing the work. */
export async function checkOperationLimit(
  supabase: SupabaseClient,
  userId: string,
  operation: Exclude<UsageOperation, "upload">,
): Promise<LimitCheck> {
  const tier = getTier(await getUserTier(supabase, userId));
  const limits = tier.limits;
  const limitMap = {
    question: limits.maxQuestionsPerMonth,
    summary: limits.maxSummariesPerMonth,
    extraction: limits.maxExtractionsPerMonth,
    comparison: limits.maxComparisonsPerMonth,
  } as const;
  const limit = limitMap[operation];
  const used = await countMonthlyUsage(supabase, userId, operation);
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Monthly ${operation} limit reached (${used}/${limit}) on the ${tier.name} plan. Upgrade for more.`,
    };
  }
  return { allowed: true, used, limit };
}

/** Enforce the document-count limit before an upload. */
export async function checkDocumentLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<LimitCheck> {
  const tier = getTier(await getUserTier(supabase, userId));
  const used = await countDocuments(supabase, userId);
  const limit = tier.limits.maxDocuments;
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Document limit reached (${used}/${limit}) on the ${tier.name} plan. Delete a document or upgrade.`,
    };
  }
  return { allowed: true, used, limit };
}

/** Record a usage event. Never logs document contents. */
export async function trackUsage(
  supabase: SupabaseClient,
  event: {
    userId: string;
    operation: UsageOperation;
    documentId?: string;
    inputTokens?: number;
    outputTokens?: number;
  },
): Promise<void> {
  const inputTokens = event.inputTokens ?? 0;
  const outputTokens = event.outputTokens ?? 0;
  const { error } = await supabase.from("usage_events").insert({
    user_id: event.userId,
    operation: event.operation,
    document_id: event.documentId ?? null,
    tokens_input: inputTokens,
    tokens_output: outputTokens,
    cost_usd: estimateCostUsd(inputTokens, outputTokens),
  });
  if (error) {
    // Usage tracking must never break the user flow — log server-side only.
    console.error("trackUsage failed:", error.message);
  }
}
