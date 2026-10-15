import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { compareRequestSchema } from "@/lib/validation";
import { getProvider, AIError } from "@/lib/ai/provider";
import { comparisonSystemPrompt } from "@/lib/ai/prompts";
import { checkOperationLimit, trackUsage } from "@/lib/usage";
import { AI_CONFIG } from "@/lib/config";

/** POST /api/compare — compare two of the user's documents. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`compare:${user.id}`, 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = compareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { documentIdA, documentIdB } = parsed.data;
  if (documentIdA === documentIdB) {
    return NextResponse.json({ error: "Choose two different documents." }, { status: 400 });
  }

  const limit = await checkOperationLimit(supabase, user.id, "comparison").catch(() => null);
  if (limit && !limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  async function loadText(id: string) {
    const { data: doc } = await supabase
      .from("documents")
      .select("id, file_name, status")
      .eq("id", id)
      .single();
    if (!doc || (doc as { status: string }).status !== "ready") return null;
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("document_id", id)
      .order("chunk_index")
      .limit(60);
    const text = ((chunks ?? []) as { content: string }[])
      .map((c) => c.content)
      .join("\n\n")
      .slice(0, AI_CONFIG.maxInputChars / 2);
    return { name: (doc as { file_name: string }).file_name, text };
  }

  const [a, b] = await Promise.all([loadText(documentIdA), loadText(documentIdB)]);
  if (!a || !b || !a.text.trim() || !b.text.trim()) {
    return NextResponse.json(
      { error: "Both documents must be processed and readable to compare." },
      { status: 422 },
    );
  }

  let result;
  try {
    result = await getProvider().chat(
      [
        { role: "system", content: comparisonSystemPrompt() },
        {
          role: "user",
          content: `Document A ("${a.name}"):\n${a.text}\n\nDocument B ("${b.name}"):\n${b.text}`,
        },
      ],
      { temperature: 0.2, maxTokens: 2500, jsonMode: true },
    );
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json(
      { error: status === 503 ? "AI is not configured yet." : "Comparison failed. Try again." },
      { status },
    );
  }

  let comparison: Record<string, unknown>;
  try {
    comparison = JSON.parse(result.text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The AI returned an invalid result. Try again." }, { status: 502 });
  }

  const { data: saved } = await supabase
    .from("generated_outputs")
    .insert({
      user_id: user.id,
      document_id: documentIdA,
      kind: "comparison",
      title: `Comparison — ${a.name} vs ${b.name}`,
      input: { documentIdA, documentIdB, promptVersion: "v1" },
      output: { documentA: a.name, documentB: b.name, comparison },
    })
    .select("id")
    .single();

  await trackUsage(supabase, {
    userId: user.id,
    operation: "comparison",
    documentId: documentIdA,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return NextResponse.json({ comparison, outputId: (saved as { id: string } | null)?.id });
}
