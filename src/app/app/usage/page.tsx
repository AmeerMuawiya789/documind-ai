"use client";

import { useEffect, useState } from "react";
import { Gauge, Infinity as InfinityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageData {
  periodStart: string;
  usage: Record<string, { used: number; limit: number }>;
}

const LABELS: Record<string, string> = {
  questions: "AI questions",
  summaries: "Summaries",
  extractions: "Extractions",
  comparisons: "Comparisons",
  documents: "Documents",
};

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError("Could not load usage."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">Usage</h1>
        <p className="mt-1 text-navy-500 dark:text-navy-400">
          DocuMind AI is free for everyone — no plans, no limits, no charges.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
      )}

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-5 text-brand-600 dark:text-brand-300" /> Your activity
            </CardTitle>
            <CardDescription>
              Totals since {new Date(data.periodStart).toLocaleDateString()}. Everything is unlimited.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.usage).map(([key, u]) => (
                <div key={key} className="rounded-2xl border border-navy-100 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
                  <p className="text-sm font-medium text-navy-500 dark:text-navy-400">{LABELS[key] ?? key}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-navy-950 dark:text-white">
                    {u.used.toLocaleString()}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                    <InfinityIcon className="size-3.5" aria-hidden /> Unlimited
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
