import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { summarizeRequestSchema } from "@/lib/validation";
import { getProvider, AIError } from "@/lib/ai/provider";
import { summarizeSystemPrompt, SUMMARY_LABELS, type SummaryKind } from "@/lib/ai/prompts";
import { checkOperationLimit, trackUsage } from "@/lib/usage";
import { AI_CONFIG } from "@/lib/config";

const ADVANCED_KINDS: SummaryKind[] = ["detailed", "key-findings", "executive"];

/** POST /api/summarize — generate a summary of a document in the chosen format. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`summarize:${user.id}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = summarizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { documentId, kind } = parsed.data;

  const limit = await checkOperationLimit(supabase, user.id, "summary").catch(() => null);
  if (limit && !limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_name, status")
    .eq("id", documentId)
    .single();
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if ((doc as { status: string }).status !== "ready") {
    return NextResponse.json({ error: "Document is still being processed." }, { status: 409 });
  }

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content")
    .eq("document_id", documentId)
    .order("chunk_index")
    .limit(80);
  const text = ((chunks ?? []) as { content: string }[])
    .map((c) => c.content)
    .join("\n\n")
    .slice(0, AI_CONFIG.maxInputChars);
  if (!text.trim()) {
    return NextResponse.json({ error: "No readable text found in this document." }, { status: 422 });
  }

  let result;
  try {
    result = await getProvider().chat(
      [
        { role: "system", content: summarizeSystemPrompt(kind) },
        { role: "user", content: `Document text:\n${text}` },
      ],
      { temperature: 0.3, maxTokens: kind === "overview" ? 500 : 2000 },
    );
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json(
      { error: status === 503 ? "AI is not configured yet." : "Summarization failed. Try again." },
      { status },
    );
  }

  const { data: saved } = await supabase
    .from("generated_outputs")
    .insert({
      user_id: user.id,
      document_id: documentId,
      kind: "summary",
      title: `${SUMMARY_LABELS[kind]} — ${(doc as { file_name: string }).file_name}`,
      input: { kind, promptVersion: "v1" },
      output: { text: result.text, kind },
    })
    .select("id")
    .single();

  await trackUsage(supabase, {
    userId: user.id,
    operation: "summary",
    documentId,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return NextResponse.json({ summary: result.text, kind, outputId: (saved as { id: string } | null)?.id });
}
