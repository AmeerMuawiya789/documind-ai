"use client";

import { useEffect, useState } from "react";
import { GitCompareArrows, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

interface Doc { id: string; file_name: string; status: string }
interface Comparison {
  similarities: string[]; differences: string[]; changed_dates_amounts: string[];
  missing_sections: string[]; important_changes: string[]; report: string;
}

const SECTIONS: { key: keyof Comparison; title: string }[] = [
  { key: "report", title: "Report" },
  { key: "similarities", title: "Similarities" },
  { key: "differences", title: "Differences" },
  { key: "changed_dates_amounts", title: "Changed dates & amounts" },
  { key: "missing_sections", title: "Missing sections" },
  { key: "important_changes", title: "Important changes" },
];

export default function ComparePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<{ comparison: Comparison; names: [string, string] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documents?pageSize=50")
      .then((r) => r.json())
      .then((d) => setDocs((d.documents ?? []).filter((x: Doc) => x.status === "ready")))
      .catch(() => {});
  }, []);

  async function compare() {
    if (!idA || !idB || idA === idB || comparing) return;
    setComparing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIdA: idA, documentIdB: idB }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Comparison failed.");
      const nameA = docs.find((d) => d.id === idA)?.file_name ?? "Document A";
      const nameB = docs.find((d) => d.id === idB)?.file_name ?? "Document B";
      setResult({ comparison: data.comparison, names: [nameA, nameB] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setComparing(false);
    }
  }

  const canCompare = idA && idB && idA !== idB;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">Document comparison</h1>
        <p className="mt-1 text-navy-500 dark:text-navy-400">Spot similarities, differences and changed figures between two versions.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200" htmlFor="doc-a">Document A</label>
              <Select value={idA} onValueChange={setIdA}>
                <SelectTrigger id="doc-a"><SelectValue placeholder="Choose first document" /></SelectTrigger>
                <SelectContent>
                  {docs.filter((d) => d.id !== idB).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.file_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200" htmlFor="doc-b">Document B</label>
              <Select value={idB} onValueChange={setIdB}>
                <SelectTrigger id="doc-b"><SelectValue placeholder="Choose second document" /></SelectTrigger>
                <SelectContent>
                  {docs.filter((d) => d.id !== idA).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.file_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <Button onClick={compare} disabled={!canCompare || comparing}>
            {comparing ? <Loader2 className="size-4 animate-spin" /> : <GitCompareArrows className="size-4" />}
            {comparing ? "Comparing…" : "Compare documents"}
          </Button>
          <p className="text-xs text-navy-400">Comparison is free and unlimited for everyone.</p>
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-navy-500 dark:text-navy-400">
            Comparing <strong className="text-navy-800 dark:text-navy-200">{result.names[0]}</strong> with{" "}
            <strong className="text-navy-800 dark:text-navy-200">{result.names[1]}</strong>
          </p>
          {SECTIONS.map((s) => {
            const value = result.comparison[s.key];
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            return (
              <Card key={s.key}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
                <CardContent>
                  {typeof value === "string" ? (
                    <p className="text-sm leading-relaxed text-navy-700 dark:text-navy-300">{value}</p>
                  ) : (
                    <ul className="space-y-2">
                      {(value as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-navy-700 dark:text-navy-300">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !comparing && (
          <EmptyState
            icon={<GitCompareArrows className="size-6" />}
            title="No comparison yet"
            description="Choose two processed documents above to see what changed between them."
          />
        )
      )}
    </div>
  );
}
