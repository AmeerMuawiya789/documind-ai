/**
 * Retrieval for RAG: pgvector similarity when embeddings exist,
 * keyword fallback when they don't (e.g. AI not configured yet).
 * Document contents are treated as untrusted data — retrieved passages
 * are quoted as evidence, never executed as instructions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getProvider } from "@/lib/ai/provider";

export interface RetrievedPassage {
  chunkId: string;
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
  score: number;
}

interface ChunkRow {
  id: string;
  content: string;
  page_number: number | null;
  chunk_index: number;
}

/** Fetch candidate chunks for a document (RLS enforces ownership). */
async function fetchChunks(
  supabase: SupabaseClient,
  documentId: string,
  limit = 60,
): Promise<ChunkRow[]> {
  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, content, page_number, chunk_index")
    .eq("document_id", documentId)
    .order("chunk_index")
    .limit(limit);
  if (error) throw new Error("Could not load document text.");
  return (data ?? []) as ChunkRow[];
}

/** Simple keyword scoring fallback (no embeddings available). */
function keywordScore(query: string, content: string): number {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return 0;
  const hay = content.toLowerCase();
  let hits = 0;
  for (const t of terms) if (hay.includes(t)) hits++;
  return hits / terms.length;
}

export async function retrievePassages(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  query: string,
  topK = 6,
): Promise<RetrievedPassage[]> {
  const chunks = await fetchChunks(supabase, documentId);
  if (chunks.length === 0) return [];

  // Vector path: use the DB function (it re-checks ownership).
  try {
    const provider = getProvider();
    const [embedding] = await provider.embed([query.slice(0, 2000)]);
    if (embedding && embedding.length > 0) {
      const { data, error } = await supabase.rpc("match_document_chunks", {
        p_user_id: userId,
        p_document_id: documentId,
        p_query_embedding: embedding,
        p_match_count: topK,
      });
      if (!error && data) {
        return (data as {
          chunk_id: string; content: string; page_number: number | null;
          chunk_index: number; similarity: number;
        }[]).map((r) => ({
          chunkId: r.chunk_id,
          content: r.content,
          pageNumber: r.page_number,
          chunkIndex: r.chunk_index,
          score: r.similarity,
        }));
      }
    }
  } catch {
    // Fall through to keyword retrieval — never fail the question.
  }

  // Keyword fallback.
  return chunks
    .map((c) => ({
      chunkId: c.id,
      content: c.content,
      pageNumber: c.page_number,
      chunkIndex: c.chunk_index,
      score: keywordScore(query, c.content),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Format passages as numbered evidence for the model prompt. */
export function formatEvidence(passages: RetrievedPassage[]): string {
  return passages
    .map((p, i) => {
      const loc = p.pageNumber ? ` (page ${p.pageNumber})` : "";
      return `[${i + 1}]${loc} ${p.content}`;
    })
    .join("\n\n");
}
