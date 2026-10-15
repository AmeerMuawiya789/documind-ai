import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/conversations/[id]/messages — full history of one conversation. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, document_id, title")
    .eq("id", id)
    .single();
  if (!conv) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, role, content, sources, created_at")
    .eq("conversation_id", id)
    .order("created_at");
  if (error) return NextResponse.json({ error: "Could not load messages." }, { status: 500 });

  return NextResponse.json({ conversation: conv, messages });
}
