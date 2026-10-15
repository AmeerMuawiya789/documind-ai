"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUMMARY_LABELS, type SummaryKind } from "@/lib/ai/prompts";
import { formatDate } from "@/lib/utils";

const KINDS = Object.entries(SUMMARY_LABELS) as [SummaryKind, string][];

interface Doc { id: string; file_name: string; status: string }
interface SavedOutput { id: string; title: string; created_at: string; input: { kind?: string }; output: { text?: string } }

function SummariesInner() {
  const searchParams = useSearchParams();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docId, setDocId] = useState(searchParams.get("documentId") ?? "");
  const [kind, setKind] = useState<SummaryKind>("overview");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedOutput[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/documents?pageSize=50")
      .then((r) => r.json())
      .then((d) => setDocs((d.documents ?? []).filter((x: Doc) => x.status === "ready")))
      .catch(() => {});
    fetch("/api/outputs?kind=summary")
      .then((r) => r.json())
      .then((d) => setSaved(d.outputs ?? []))
      .catch(() => {});
  }, []);

  async function generate() {
    if (!docId || generating) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Summarization failed.");
      setResult(data.summary);
      fetch("/api/outputs?kind=summary").then((r) => r.json()).then((d) => setSaved(d.outputs ?? [])).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summarization failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download(text: string, title: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 60)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate a summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200" htmlFor="sum-doc">Document</label>
              <Select value={docId} onValueChange={setDocId}>
                <SelectTrigger id="sum-doc"><SelectValue placeholder="Choose a document" /></SelectTrigger>
                <SelectContent>
                  {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.file_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200">Format</span>
              <Tabs value={kind} onValueChange={(v) => setKind(v as SummaryKind)}>
                <TabsList className="flex flex-wrap h-auto">
                  {KINDS.map(([k, label]) => (
                    <TabsTrigger key={k} value={k} className="text-xs">{label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <Button onClick={generate} disabled={!docId || generating}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {generating ? "Generating…" : "Generate summary"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-brand-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{SUMMARY_LABELS[kind]}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(result)}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => download(result, SUMMARY_LABELS[kind])}>
                <Download className="size-4" /> Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-800 dark:text-navy-200">{result}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-navy-900 dark:text-navy-100">Saved summaries</h2>
        {saved.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-6" />}
            title="No summaries yet"
            description="Generate your first summary above — it will be saved here automatically."
          />
        ) : (
          <div className="space-y-4">
            {saved.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm">{s.title}</CardTitle>
                    <p className="text-xs text-navy-400">{formatDate(s.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => s.output.text && copy(s.output.text)} aria-label="Copy summary">
                      <Copy className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => s.output.text && download(s.output.text, s.title)} aria-label="Download summary">
                      <Download className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-700 line-clamp-6 dark:text-navy-300">{s.output.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummariesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">Summaries</h1>
        <p className="mt-1 text-navy-500 dark:text-navy-400">Seven formats, from quick overviews to executive briefs.</p>
      </div>
      <Suspense fallback={<p className="text-navy-400">Loading…</p>}>
        <SummariesInner />
      </Suspense>
    </div>
  );
}
