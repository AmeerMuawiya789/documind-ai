import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * DELETE /api/account — permanently deletes the caller's account and
 * everything with it: storage files, documents, chunks, conversations,
 * messages, generated outputs, usage events, subscription.
 * Database rows cascade from profiles; storage objects are removed first.
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rate = checkRateLimit(`delete-account:${user.id}`, 3);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const service = createServiceClient();

  // Remove all storage objects under the user's folder (paginated).
  try {
    let page = 0;
    for (;;) {
      const { data: objects, error } = await service.storage
        .from("documents")
        .list(user.id, { limit: 100, offset: page * 100 });
      if (error || !objects || objects.length === 0) break;
      // list() is non-recursive; also list nested doc folders.
      const paths: string[] = [];
      for (const obj of objects) {
        if (obj.id) {
          paths.push(`${user.id}/${obj.name}`);
        } else {
          const { data: nested } = await service.storage
            .from("documents")
            .list(`${user.id}/${obj.name}`, { limit: 1000 });
          for (const n of nested ?? []) paths.push(`${user.id}/${obj.name}/${n.name}`);
        }
      }
      if (paths.length > 0) await service.storage.from("documents").remove(paths);
      if (objects.length < 100) break;
      page++;
    }
  } catch (err) {
    console.error("Account deletion: storage cleanup failed:", err);
    return NextResponse.json(
      { error: "Could not delete your files. Please contact support." },
      { status: 500 },
    );
  }

  // Delete the profile — FK cascades remove everything else.
  // Then delete the auth user via the admin API.
  const { error: profileError } = await service.from("profiles").delete().eq("id", user.id);
  if (profileError) {
    console.error("Account deletion: profile delete failed:", profileError.message);
    return NextResponse.json({ error: "Could not delete your account data." }, { status: 500 });
  }

  const { error: authError } = await service.auth.admin.deleteUser(user.id);
  if (authError) {
    console.error("Account deletion: auth user delete failed:", authError.message);
    // Profile data is gone; the auth record remains — surface honestly.
    return NextResponse.json(
      { error: "Your data was deleted, but the login record needs manual removal. Please contact support." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
