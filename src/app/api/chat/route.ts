import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validation";
import { getProvider, AIError, estimateCostUsd } from "@/lib/ai/provider";
import { retrievePassages, formatEvidence } from "@/lib/ai/retrieval";
import { chatSystemPrompt, chatUserPrompt, PROMPT_VERSION } from "@/lib/ai/prompts";
import { checkOperationLimit, trackUsage } from "@/lib/usage";
import { AI_CONFIG } from "@/lib/config";

/**
 * POST /api/chat — ask a question about one of your documents.
 * Retrieval-augmented: only retrieved passages reach the model.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`chat:${user.id}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { documentId, conversationId, message } = parsed.data;

  const limit = await checkOperationLimit(supabase, user.id, "question").catch(() => null);
  if (limit && !limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  // Ownership enforced by RLS; also require a successfully processed document.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_name, status")
    .eq("id", documentId)
    .single();
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if ((doc as { status: string }).status !== "ready") {
    return NextResponse.json(
      { error: "This document is still being processed. Please try again shortly." },
      { status: 409 },
    );
  }

  const passages = await retrievePassages(supabase, user.id, documentId, message, 6);

  // Conversation: reuse or create.
  let convId = conversationId;
  if (convId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", convId)
      .eq("document_id", documentId)
      .single();
    if (!conv) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  } else {
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        document_id: documentId,
        title: message.slice(0, 60),
      })
      .select("id")
      .single();
    if (error || !conv) {
      return NextResponse.json({ error: "Could not start conversation." }, { status: 500 });
    }
    convId = (conv as { id: string }).id;
  }

  await supabase.from("messages").insert({
    conversation_id: convId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  // No retrievable evidence → honest answer, no AI call needed.
  if (passages.length === 0) {
    const answer =
      "The document doesn't contain enough searchable text to answer that. It may be scanned or still processing.";
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content: answer,
      sources: [],
    });
    await trackUsage(supabase, { userId: user.id, operation: "question", documentId });
    return NextResponse.json({ answer, sources: [], conversationId: convId });
  }

  let result;
  try {
    const provider = getProvider();
    result = await provider.chat(
      [
        { role: "system", content: chatSystemPrompt() },
        { role: "user", content: chatUserPrompt(message, formatEvidence(passages)) },
      ],
      { temperature: 0.2, maxTokens: 1200 },
    );
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    const friendly =
      status === 503
        ? "AI is not configured yet. Ask the workspace owner to set AI_API_KEY."
        : "The AI service failed. Please try again in a moment.";
    return NextResponse.json({ error: friendly }, { status });
  }

  const sources = passages.map((p, i) => ({
    n: i + 1,
    chunkId: p.chunkId,
    pageNumber: p.pageNumber,
    excerpt: p.content.slice(0, 280),
  }));

  await supabase.from("messages").insert({
    conversation_id: convId,
    user_id: user.id,
    role: "assistant",
    content: result.text,
    sources,
  });
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId);

  await trackUsage(supabase, {
    userId: user.id,
    operation: "question",
    documentId,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });
  void estimateCostUsd;

  return NextResponse.json({
    answer: result.text,
    sources,
    conversationId: convId,
    promptVersion: PROMPT_VERSION,
    model: AI_CONFIG.chatModel,
  });
}
