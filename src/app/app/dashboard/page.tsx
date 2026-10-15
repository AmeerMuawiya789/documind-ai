import Link from "next/link";
import { Files, MessageSquareText, FileText, GitCompareArrows, UploadCloud, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { countMonthlyUsage, countDocuments } from "@/lib/usage";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [docCount, questions, summaries] = user
    ? await Promise.all([
        countDocuments(supabase, user.id),
        countMonthlyUsage(supabase, user.id, "question"),
        countMonthlyUsage(supabase, user.id, "summary"),
      ])
    : [0, 0, 0];

  const { data: recent } = user
    ? await supabase
        .from("documents")
        .select("id, file_name, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const stats = [
    { icon: Files, label: "Documents", value: docCount },
    { icon: MessageSquareText, label: "Questions this month", value: questions },
    { icon: FileText, label: "Summaries this month", value: summaries },
  ];

  const quickActions = [
    { href: "/app/documents", icon: UploadCloud, title: "Upload a document", text: "PDF, Word or text up to 20 MB" },
    { href: "/app/ask", icon: MessageSquareText, title: "Ask a question", text: "Cited answers from your files" },
    { href: "/app/summaries", icon: FileText, title: "Generate a summary", text: "Seven formats to choose from" },
    { href: "/app/compare", icon: GitCompareArrows, title: "Compare documents", text: "Spot what changed" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">
            Good to see you{user?.user_metadata?.full_name ? `, ${String(user.user_metadata.full_name).split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-navy-500 dark:text-navy-400">Here's what's happening with your documents.</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Sparkles className="size-3.5" /> Free forever
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <s.icon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-950 dark:text-white">
                  {s.value}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-navy-900 dark:text-navy-100">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-5">
                  <a.icon className="size-6 text-brand-600 dark:text-brand-300" aria-hidden />
                  <p className="mt-3 font-semibold text-navy-900 dark:text-navy-100">{a.title}</p>
                  <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">{a.text}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent documents</CardTitle>
            <CardDescription>Your latest uploads and their status.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/documents">View all <ArrowRight className="size-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(recent ?? []).length === 0 ? (
            <EmptyState
              icon={<Files className="size-6" />}
              title="No documents yet"
              description="Upload your first PDF, Word or text file and start asking questions in seconds."
              action={<Button asChild><Link href="/app/documents">Upload a document</Link></Button>}
            />
          ) : (
            <ul className="divide-y divide-navy-100 dark:divide-navy-800">
              {(recent ?? []).map((d: { id: string; file_name: string; status: string; created_at: string }) => (
                <li key={d.id}>
                  <Link href={`/app/documents/${d.id}`} className="flex items-center justify-between gap-4 py-3.5 hover:bg-navy-50/50 rounded-lg px-2 -mx-2 dark:hover:bg-navy-800/50">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="size-5 shrink-0 text-navy-300" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy-900 dark:text-navy-100">{d.file_name}</p>
                        <p className="text-xs text-navy-400">{formatDate(d.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={d.status === "ready" ? "success" : d.status === "failed" ? "destructive" : "warning"}>
                      {d.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
