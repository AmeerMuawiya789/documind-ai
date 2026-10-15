"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, FileUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";

export function UploadDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function pick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setError(null);
  }

  async function upload() {
    if (!file) return;
    setProgress("uploading");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      // Uploading the bytes…
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      setProgress("processing");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed. Please try again.");
      }
      setProgress("idle");
      setFile(null);
      setOpen(false);
      onDone();
      router.push(`/app/documents/${data.document.id}`);
    } catch (err) {
      setProgress("error");
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setFile(null); setError(null); setProgress("idle"); } }}>
      <DialogTrigger asChild>
        <Button variant="gradient"><UploadCloud className="size-4" /> Upload document</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>
            PDF, DOCX, TXT, MD or CSV — up to 20 MB. Files are stored privately.
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/50 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-navy-700 dark:bg-navy-900/50 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
        >
          <FileUp className="size-10 text-brand-500" aria-hidden />
          {file ? (
            <div className="flex items-center gap-2 text-sm font-medium text-navy-900 dark:text-navy-100">
              <span className="max-w-[220px] truncate">{file.name}</span>
              <button
                aria-label="Remove file"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="rounded-full p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-navy-800 dark:hover:text-navy-300"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-navy-800 dark:text-navy-200">Drop a file here or click to browse</p>
              <p className="text-xs text-navy-400">PDF · DOCX · TXT · MD · CSV — max 20 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.csv"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        {progress === "uploading" || progress === "processing" ? (
          <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-500/15">
            <span className="size-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-700" aria-hidden />
            {progress === "uploading" ? "Uploading…" : "Extracting text and indexing…"}
          </div>
        ) : null}

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}

        <Button onClick={upload} disabled={!file || progress === "uploading" || progress === "processing"} className="w-full">
          {progress === "uploading" || progress === "processing" ? "Working…" : "Upload & process"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
