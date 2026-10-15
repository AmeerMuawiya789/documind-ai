import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateFile, extractDocumentText, ExtractionError } from "@/lib/documents/extract";
import { chunkPages } from "@/lib/ai/chunking";
import { getProvider } from "@/lib/ai/provider";
import { checkDocumentLimit, trackUsage } from "@/lib/usage";
import { safeFileName } from "@/lib/utils";

/**
 * POST /api/documents/upload — multipart form with a `file` field.
 * Validates → stores privately → extracts text → chunks → embeds → marks ready.
 * The document is only reported as processed after processing succeeds.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`upload:${user.id}`, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const limit = await checkDocumentLimit(supabase, user.id).catch(() => null);
  if (limit && !limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  try {
    validateFile(file.name, file.type, file.size);
  } catch (err) {
    if (err instanceof ExtractionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const service = createServiceClient();
  const documentId = crypto.randomUUID();
  const storagePath = `${user.id}/${documentId}/${safeFileName(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  // 1. Private storage upload (service role; path is namespaced to the user).
  const { error: uploadError } = await service.storage
    .from("documents")
    .upload(storagePath, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  // 2. Metadata row (user client → RLS enforced).
  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    user_id: user.id,
    file_name: safeFileName(file.name),
    storage_path: storagePath,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    status: "processing",
  });
  if (insertError) {
    await service.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ error: "Could not save document metadata." }, { status: 500 });
  }

  // 3. Extraction → chunking → embeddings. Only "ready" on success.
  try {
    const extracted = await extractDocumentText(bytes.buffer as ArrayBuffer, file.name);
    const chunks = chunkPages(extracted.pages);

    const embeddings: number[][] = [];
    try {
      const provider = getProvider();
      const BATCH = 40;
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batch = chunks.slice(i, i + BATCH).map((c) => c.content.slice(0, 8000));
        embeddings.push(...(await provider.embed(batch)));
      }
    } catch (embedError) {
      // Embeddings are an enhancement — keyword retrieval still works.
      console.error("Embedding generation failed, continuing without vectors:", embedError);
    }

    if (chunks.length > 0) {
      const rows = chunks.map((c, i) => ({
        document_id: documentId,
        user_id: user.id,
        chunk_index: c.index,
        content: c.content,
        page_number: c.pageNumber,
        embedding: embeddings[i] ?? null,
      }));
      const { error: chunkError } = await service.from("document_chunks").insert(rows);
      if (chunkError) throw new Error("Could not store document text.");
    }

    const statusNote = extracted.likelyScanned
      ? "ready"
      : "ready";
    await service
      .from("documents")
      .update({
        status: statusNote,
        page_count: extracted.pageCount,
        char_count: extracted.charCount,
        error_message: extracted.likelyScanned
          ? "This looks like a scanned PDF with little embedded text. Results may be limited — OCR support is on the roadmap."
          : null,
      })
      .eq("id", documentId);

    await trackUsage(service, { userId: user.id, operation: "upload", documentId });
  } catch (err) {
    const message =
      err instanceof ExtractionError
        ? err.message
        : "Processing failed. The file was saved but its text could not be read.";
    await service
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", documentId);
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, size_bytes, status, page_count, char_count, created_at, error_message")
    .eq("id", documentId)
    .single();

  return NextResponse.json({ document }, { status: 201 });
}
