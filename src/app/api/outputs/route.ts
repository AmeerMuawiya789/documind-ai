import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/outputs?kind=summary&page= — saved summaries, extractions, comparisons. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const kind = params.get("kind");
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = 20;

  let query = supabase
    .from("generated_outputs")
    .select("id, kind, title, input, output, created_at, document_id", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (kind === "summary" || kind === "extraction" || kind === "comparison") {
    query = query.eq("kind", kind);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: "Could not load outputs." }, { status: 500 });
  return NextResponse.json({ outputs: data, total: count ?? 0, page });
}
