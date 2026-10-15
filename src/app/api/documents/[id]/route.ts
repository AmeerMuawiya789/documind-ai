import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { renameDocumentSchema, uuidSchema } from "@/lib/validation";
import { safeFileName } from "@/lib/utils";

async function requireUserAndDoc(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: "Invalid document id." }, { status: 400 }) };
  }
  // RLS guarantees this only returns the caller's own document.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, user_id, file_name, storage_path, status")
    .eq("id", id)
    .single();
  if (!doc) return { error: NextResponse.json({ error: "Document not found." }, { status: 404 }) };
  return { supabase, user, doc: doc as { id: string; user_id: string; file_name: string; storage_path: string; status: string } };
}

/** GET /api/documents/[id] — document detail with chunk count. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await requireUserAndDoc(id);
  if (found.error) return found.error;
  const { supabase, doc } = found;

  const { count } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("document_id", doc.id);

  const { data: full } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, size_bytes, status, page_count, char_count, created_at, error_message")
    .eq("id", doc.id)
    .single();

  return NextResponse.json({ document: { ...full, chunk_count: count ?? 0 } });
}

/** PATCH /api/documents/[id] — rename. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await requireUserAndDoc(id);
  if (found.error) return found.error;
  const { supabase, doc } = found;

  const body = await request.json().catch(() => ({}));
  const parsed = renameDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  }

  const { error } = await supabase
    .from("documents")
    .update({ file_name: safeFileName(parsed.data.fileName) })
    .eq("id", doc.id);
  if (error) return NextResponse.json({ error: "Could not rename." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/documents/[id] — removes storage file + all derived data (cascades). */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await requireUserAndDoc(id);
  if (found.error) return found.error;
  const { supabase, doc } = found;

  const service = createServiceClient();
  // Storage file first, then the DB row (chunks/messages cascade).
  await service.storage.from("documents").remove([doc.storage_path]);

  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
