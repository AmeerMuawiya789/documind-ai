import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTier } from "@/lib/config";
import { getUserTier, countMonthlyUsage, countDocuments } from "@/lib/usage";

/** GET /api/usage — current tier, monthly usage per operation, document count. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const tierId = await getUserTier(supabase, user.id);
  const tier = getTier(tierId);
  const [questions, summaries, extractions, comparisons, documents] = await Promise.all([
    countMonthlyUsage(supabase, user.id, "question"),
    countMonthlyUsage(supabase, user.id, "summary"),
    countMonthlyUsage(supabase, user.id, "extraction"),
    countMonthlyUsage(supabase, user.id, "comparison"),
    countDocuments(supabase, user.id),
  ]);

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  return NextResponse.json({
    tier: tierId,
    tierName: tier.name,
    periodStart: start.toISOString(),
    usage: {
      questions: { used: questions, limit: tier.limits.maxQuestionsPerMonth },
      summaries: { used: summaries, limit: tier.limits.maxSummariesPerMonth },
      extractions: { used: extractions, limit: tier.limits.maxExtractionsPerMonth },
      comparisons: { used: comparisons, limit: tier.limits.maxComparisonsPerMonth },
      documents: { used: documents, limit: tier.limits.maxDocuments },
    },
  });
}
