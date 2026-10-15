import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquareText, FilePlus2, TableProperties, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatBytes, formatDate } from "@/lib/utils";

export default async function DocumentViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Direct DB read (same request, RLS enforced) — never trust client fetches.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, size_bytes, status, page_count, char_count, created_at, error_message")
    .eq("id", id)
    .single();

  if (!doc) return notFound();
  const d = doc as {
    id: string; file_name: string; mime_type: string; size_bytes: number;
    status: string; page_count: number | null; char_count: number | null;
    created_at: string; error_message: string | null;
  };

  const { count: chunkCount } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("document_id", id);

  const actions = [
    { href: `/app/ask?documentId=${d.id}`, icon: MessageSquareText, label: "Ask questions", desc: "Chat with cited answers" },
    { href: `/app/summaries?documentId=${d.id}`, icon: FilePlus2, label: "Summarize", desc: "Seven summary formats" },
    { href: `/app/extracted?documentId=${d.id}`, icon: TableProperties, label: "Extract data", desc: "Structured fields + evidence" },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/app/documents"><ArrowLeft className="size-4" /> All documents</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <FileText className="size-7" aria-hidden />
          </div>
          <div>
            <h1 className="max-w-xl truncate text-2xl font-bold tracking-tight text-navy-950 dark:text-white">
              {d.file_name}
            </h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              {formatBytes(d.size_bytes)} · Uploaded {formatDate(d.created_at)}
              {d.page_count ? ` · ${d.page_count} pages` : ""}
              {d.char_count ? ` · ${d.char_count.toLocaleString()} characters` : ""}
            </p>
          </div>
        </div>
        <Badge variant={d.status === "ready" ? "success" : d.status === "failed" ? "destructive" : "warning"} className="text-sm px-3 py-1">
          {d.status}
        </Badge>
      </div>

      {d.status === "failed" && (
        <Card className="border-red-200 bg-red-50/60 dark:border-red-500/30">
          <CardContent className="p-5 text-sm text-red-800 dark:text-red-300">
            <strong>Processing failed.</strong> {d.error_message ?? "The file couldn't be read."}
          </CardContent>
        </Card>
      )}

      {d.error_message && d.status === "ready" && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-500/30">
          <CardContent className="p-5 text-sm text-amber-800 dark:text-amber-300">{d.error_message}</CardContent>
        </Card>
      )}

      {d.status === "ready" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {actions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-5">
                  <a.icon className="size-6 text-brand-600 dark:text-brand-300" aria-hidden />
                  <p className="mt-3 font-semibold text-navy-900 dark:text-navy-100">{a.label}</p>
                  <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">{a.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-navy-400">File type</dt><dd className="mt-0.5 font-medium text-navy-900 dark:text-navy-100">{d.mime_type}</dd></div>
            <div><dt className="text-navy-400">Size</dt><dd className="mt-0.5 font-medium text-navy-900 dark:text-navy-100">{formatBytes(d.size_bytes)}</dd></div>
            <div><dt className="text-navy-400">Text passages indexed</dt><dd className="mt-0.5 font-medium text-navy-900 dark:text-navy-100">{chunkCount ?? 0}</dd></div>
            <div><dt className="text-navy-400">Status</dt><dd className="mt-0.5 font-medium text-navy-900 capitalize dark:text-navy-100">{d.status}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
