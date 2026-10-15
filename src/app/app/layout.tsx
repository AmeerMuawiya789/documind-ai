import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side session validation — never trust the client alone.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/app/dashboard");

  return (
    <div className="flex min-h-screen bg-navy-50/50 dark:bg-navy-950">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
