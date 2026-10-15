import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** GET /api/documents?q=&page=&pageSize= — paginated, searchable, own docs only. */
export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`docs:${user.id}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim().slice(0, 100) ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize")) || 20));

  let query = supabase
    .from("documents")
    .select("id, file_name, mime_type, size_bytes, status, page_count, char_count, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (q) query = query.ilike("file_name", `%${q.replace(/[%_]/g, "")}%`);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not load documents." }, { status: 500 });
  }
  return NextResponse.json({ documents: data, total: count ?? 0, page, pageSize });
}
