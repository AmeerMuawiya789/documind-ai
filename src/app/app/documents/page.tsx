"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Files, Search, Trash2, Pencil, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { UploadDialog } from "@/components/app/upload-dialog";
import { formatBytes, formatDate } from "@/lib/utils";

interface Doc {
  id: string; file_name: string; mime_type: string; size_bytes: number;
  status: string; page_count: number | null; char_count: number | null;
  created_at: string; error_message?: string | null;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [renaming, setRenaming] = useState<Doc | null>(null);
  const [newName, setNewName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 12;

  // Fetch on mount, page/search change, or manual refresh.
  // State updates happen in promise callbacks, never synchronously in the effect.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), q });
    fetch(`/api/documents?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setDocs(data.documents ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, q, refreshKey]);

  function refresh() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  function handleSearch(v: string) {
    setQ(v);
    setLoading(true);
  }

  function handlePage(next: number) {
    setPage(next);
    setLoading(true);
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [q]);

  async function confirmDelete() {
    if (!deleting) return;
    await fetch(`/api/documents/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    if (docs.length === 1 && page > 1) handlePage(page - 1);
    else refresh();
  }

  async function confirmRename() {
    if (!renaming || !newName.trim()) return;
    const res = await fetch(`/api/documents/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: newName.trim() }),
    });
    if (res.ok) {
      setRenaming(null);
      refresh();
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">My Documents</h1>
          <p className="mt-1 text-navy-500 dark:text-navy-400">{total} document{total === 1 ? "" : "s"} in your private library.</p>
        </div>
        <UploadDialog onDone={refresh} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" aria-hidden />
        <Input
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search documents…"
          className="pl-10"
          aria-label="Search documents"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<Files className="size-6" />}
          title={q ? "No matches" : "No documents yet"}
          description={q ? `Nothing matches "${q}".` : "Upload your first PDF, Word or text file to get started."}
          action={!q ? <UploadDialog onDone={refresh} /> : undefined}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <Card key={d.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        <FileText className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/app/documents/${d.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-brand-700 dark:text-navy-100 dark:hover:text-brand-300">
                          {d.file_name}
                        </Link>
                        <p className="text-xs text-navy-400">
                          {formatBytes(d.size_bytes)} · {formatDate(d.created_at)}
                          {d.page_count ? ` · ${d.page_count} pages` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={d.status === "ready" ? "success" : d.status === "failed" ? "destructive" : "warning"}>
                      {d.status}
                    </Badge>
                  </div>
                  {d.status === "failed" && d.error_message && (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{d.error_message}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" asChild className="flex-1">
                      <Link href={`/app/documents/${d.id}`}>Open</Link>
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => { setRenaming(d); setNewName(d.file_name); }}
                      aria-label={`Rename ${d.file_name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                      onClick={() => setDeleting(d)}
                      aria-label={`Delete ${d.file_name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-navy-500 dark:text-navy-400">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              “{deleting?.file_name}” and everything derived from it — text index,
              conversations, summaries — will be permanently removed. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={!!renaming} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={120}
            aria-label="New document name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={confirmRename} disabled={!newName.trim()}>
              {false ? <Loader2 className="size-4 animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
