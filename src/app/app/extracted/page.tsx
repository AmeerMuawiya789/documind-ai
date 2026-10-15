"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TableProperties, Loader2, Plus, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

interface Doc { id: string; file_name: string; status: string }
interface FieldResult { value: string | null; evidence: string | null; confidence: "high" | "medium" | "low" }
interface SavedOutput {
  id: string; title: string; created_at: string;
  input: { fields?: string[] };
  output: { fields?: string[]; extracted?: Record<string, FieldResult> };
}

const PRESETS = ["Dates", "Names", "Amounts", "Deadlines", "Tasks", "Email addresses"];

function ExtractedInner() {
  const searchParams = useSearchParams();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docId, setDocId] = useState(searchParams.get("documentId") ?? "");
  const [fields, setFields] = useState<string[]>(["Dates", "Amounts", "Names"]);
  const [custom, setCustom] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<{ fields: string[]; extracted: Record<string, FieldResult> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedOutput[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/documents?pageSize=50")
      .then((r) => r.json())
      .then((d) => setDocs((d.documents ?? []).filter((x: Doc) => x.status === "ready")))
      .catch(() => {});
    fetch("/api/outputs?kind=extraction")
      .then((r) => r.json())
      .then((d) => setSaved(d.outputs ?? []))
      .catch(() => {});
  }, []);

  function togglePreset(p: string) {
    setFields((f) => (f.includes(p) ? f.filter((x) => x !== p) : [...f, p].slice(0, 20)));
  }

  function addCustom() {
    const v = custom.trim();
    if (v && !fields.includes(v) && fields.length < 20) setFields((f) => [...f, v]);
    setCustom("");
  }

  async function extract() {
    if (!docId || fields.length === 0 || extracting) return;
    setExtracting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed.");
      setResult({ fields: data.fields, extracted: data.extracted });
      fetch("/api/outputs?kind=extraction").then((r) => r.json()).then((d) => setSaved(d.outputs ?? [])).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  function renderTable(fieldsList: string[], extracted: Record<string, FieldResult>) {
    return (
      <div className="overflow-x-auto rounded-xl border border-navy-100 dark:border-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-500 dark:bg-navy-800 dark:text-navy-400">
              <th className="px-4 py-3 font-semibold">Field</th>
              <th className="px-4 py-3 font-semibold">Value</th>
              <th className="px-4 py-3 font-semibold">Evidence</th>
              <th className="px-4 py-3 font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
            {fieldsList.map((f) => {
              const r = extracted[f];
              return (
                <tr key={f}>
                  <td className="px-4 py-3 font-medium text-navy-900 dark:text-navy-100">{f}</td>
                  <td className="px-4 py-3 text-navy-700 dark:text-navy-300">{r?.value ?? <span className="text-navy-300">—</span>}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-navy-500 dark:text-navy-400">
                    {r?.evidence ? <span className="italic">“{r.evidence}”</span> : <span className="text-navy-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r ? (
                      <Badge variant={r.confidence === "high" ? "success" : r.confidence === "medium" ? "warning" : "secondary"}>
                        {r.confidence}
                      </Badge>
                    ) : <span className="text-navy-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  async function copyJson(extracted: Record<string, FieldResult>) {
    await navigator.clipboard.writeText(JSON.stringify(extracted, null, 2)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Extract structured data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200" htmlFor="ext-doc">Document</label>
            <Select value={docId} onValueChange={setDocId}>
              <SelectTrigger id="ext-doc"><SelectValue placeholder="Choose a document" /></SelectTrigger>
              <SelectContent>
                {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.file_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200">Fields to extract</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePreset(p)}
                  aria-pressed={fields.includes(p)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${fields.includes(p) ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-navy-200 text-navy-600 hover:border-navy-300 dark:border-navy-700 dark:text-navy-300"}`}
                >
                  {p}
                </button>
              ))}
              {fields.filter((f) => !PRESETS.includes(f)).map((f) => (
                <span key={f} className="flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {f}
                  <button onClick={() => setFields((x) => x.filter((y) => y !== f))} aria-label={`Remove ${f}`}>
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={custom} onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="Add a custom field, e.g. Contract value"
                maxLength={80}
                aria-label="Custom field name"
              />
              <Button variant="outline" onClick={addCustom}><Plus className="size-4" /> Add</Button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <Button onClick={extract} disabled={!docId || fields.length === 0 || extracting}>
            {extracting ? <Loader2 className="size-4 animate-spin" /> : <TableProperties className="size-4" />}
            {extracting ? "Extracting…" : "Extract data"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-brand-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Extraction result</CardTitle>
            <Button size="sm" variant="outline" onClick={() => copyJson(result.extracted)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy JSON"}
            </Button>
          </CardHeader>
          <CardContent>{renderTable(result.fields, result.extracted)}</CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-navy-900 dark:text-navy-100">Saved extractions</h2>
        {saved.length === 0 ? (
          <EmptyState
            icon={<TableProperties className="size-6" />}
            title="No extractions yet"
            description="Run your first extraction above — results are saved here with their evidence."
          />
        ) : (
          <div className="space-y-4">
            {saved.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{s.title}</CardTitle>
                  <p className="text-xs text-navy-400">{formatDate(s.created_at)}</p>
                </CardHeader>
                <CardContent>
                  {s.output.fields && s.output.extracted
                    ? renderTable(s.output.fields, s.output.extracted)
                    : <p className="text-sm text-navy-400">No data.</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExtractedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">Extracted data</h1>
        <p className="mt-1 text-navy-500 dark:text-navy-400">Facts with evidence — clearly separated from interpretation.</p>
      </div>
      <Suspense fallback={<p className="text-navy-400">Loading…</p>}>
        <ExtractedInner />
      </Suspense>
    </div>
  );
}
