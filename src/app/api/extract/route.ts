import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractRequestSchema } from "@/lib/validation";
import { getProvider, AIError } from "@/lib/ai/provider";
import { extractionSystemPrompt } from "@/lib/ai/prompts";
import { checkOperationLimit, trackUsage } from "@/lib/usage";
import { AI_CONFIG } from "@/lib/config";

/** POST /api/extract — pull structured fields out of a document. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`extract:${user.id}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const { documentId, fields } = parsed.data;

  const limit = await checkOperationLimit(supabase, user.id, "extraction").catch(() => null);
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
        { role: "system", content: extractionSystemPrompt(fields) },
        { role: "user", content: `Document text:\n${text}` },
      ],
      { temperature: 0, maxTokens: 2000, jsonMode: true },
    );
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json(
      { error: status === 503 ? "AI is not configured yet." : "Extraction failed. Try again." },
      { status },
    );
  }

  let extracted: Record<string, unknown>;
  try {
    extracted = JSON.parse(result.text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The AI returned an invalid result. Try again." }, { status: 502 });
  }

  const { data: saved } = await supabase
    .from("generated_outputs")
    .insert({
      user_id: user.id,
      document_id: documentId,
      kind: "extraction",
      title: `Extraction — ${(doc as { file_name: string }).file_name}`,
      input: { fields, promptVersion: "v1" },
      output: { fields, extracted },
    })
    .select("id")
    .single();

  await trackUsage(supabase, {
    userId: user.id,
    operation: "extraction",
    documentId,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return NextResponse.json({ extracted, fields, outputId: (saved as { id: string } | null)?.id });
}
