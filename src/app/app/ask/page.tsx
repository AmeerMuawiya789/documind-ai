"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquareText, Send, Loader2, FileText, Quote, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Doc { id: string; file_name: string; status: string }
interface Source { n: number; pageNumber: number | null; excerpt: string }
interface Msg { id: string; role: "user" | "assistant"; content: string; sources?: Source[] }
interface Conversation { id: string; title: string }

function AskInner() {
  const searchParams = useSearchParams();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docId, setDocId] = useState(searchParams.get("documentId") ?? "");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/documents?pageSize=50")
      .then((r) => r.json())
      .then((d) => {
        const ready = (d.documents ?? []).filter((x: Doc) => x.status === "ready");
        setDocs(ready);
        if (!docId && searchParams.get("documentId")) setDocId(searchParams.get("documentId")!);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDocChange(id: string) {
    setDocId(id);
    setConversations([]);
    setMessages([]);
    setConvId(undefined);
  }

  useEffect(() => {
    if (!docId) return;
    fetch(`/api/conversations?documentId=${docId}`)
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => {});
  }, [docId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function openConversation(id: string) {
    setConvId(id);
    const res = await fetch(`/api/conversations/${id}/messages`);
    const data = await res.json();
    setMessages((data.messages ?? []).map((m: Msg) => ({ ...m })));
  }

  function newChat() {
    setConvId(undefined);
    setMessages([]);
    setError(null);
  }

  async function send() {
    const text = input.trim();
    if (!text || !docId || sending) return;
    setInput("");
    setError(null);
    const tempId = `temp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: text }]);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, conversationId: convId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.conversationId && data.conversationId !== convId) {
        setConvId(data.conversationId);
        fetch(`/api/conversations?documentId=${docId}`)
          .then((r) => r.json())
          .then((d) => setConversations(d.conversations ?? []))
          .catch(() => {});
      }
      setMessages((m) => [
        ...m.filter((x) => x.id !== tempId),
        { id: tempId, role: "user", content: text },
        { id: `a-${Date.now()}`, role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setInput(text);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
    setConversations((c) => c.filter((x) => x.id !== id));
    if (convId === id) newChat();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-navy-800 dark:text-navy-200" htmlFor="doc-select">
            Document
          </label>
          <Select value={docId} onValueChange={handleDocChange}>
            <SelectTrigger id="doc-select">
              <SelectValue placeholder="Choose a document" />
            </SelectTrigger>
            <SelectContent>
              {docs.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.file_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="w-full" onClick={newChat} disabled={!docId}>
          <Plus className="size-4" /> New conversation
        </Button>
        {conversations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">History</p>
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 rounded-xl px-3 py-2 text-sm",
                  convId === c.id ? "bg-brand-50 text-brand-900 dark:bg-brand-500/15" : "text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800",
                )}
              >
                <button onClick={() => openConversation(c.id)} className="min-w-0 flex-1 truncate text-left">
                  {c.title}
                </button>
                <button
                  onClick={() => deleteConversation(c.id)}
                  aria-label="Delete conversation"
                  className="rounded p-1 text-navy-300 opacity-0 hover:text-red-600 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <Card className="flex min-h-[60vh] flex-col overflow-hidden">
        {!docId ? (
          <EmptyState
            className="m-4 flex-1 border-0"
            icon={<MessageSquareText className="size-6" />}
            title="Choose a document to start asking"
            description="Answers are grounded in your document's text and cite their sources."
          />
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {messages.length === 0 && !sending && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                    <FileText className="size-6" />
                  </div>
                  <p className="max-w-sm text-sm text-navy-500 dark:text-navy-400">
                    Ask anything about this document — e.g. “What are the key dates?” or
                    “Summarize the payment terms.”
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={cn("flex animate-msg-in", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%]",
                      m.role === "user"
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md bg-navy-50 text-navy-800 dark:bg-navy-800 dark:text-navy-200",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-navy-200/60 pt-3 dark:border-navy-700/60">
                        {m.sources.map((s) => (
                          <p key={s.n} className="flex items-start gap-1.5 text-xs text-navy-500 dark:text-navy-400">
                            <Quote className="mt-0.5 size-3 shrink-0 text-brand-500" aria-hidden />
                            <span>
                              <strong className="text-brand-700 dark:text-brand-300">[{s.n}]</strong>
                              {s.pageNumber ? ` p. ${s.pageNumber} — ` : " — "}
                              {s.excerpt}…
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-sm text-navy-400">
                  <Loader2 className="size-4 animate-spin" /> Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-navy-100 p-4 dark:border-navy-800">
              {error && (
                <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  placeholder="Ask a question about this document…"
                  className="min-h-[48px] resize-none"
                  aria-label="Your question"
                />
                <Button onClick={send} disabled={sending || !input.trim()} aria-label="Send question">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-navy-400">
                Answers are grounded in your document. Verify important details against the cited passages.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function AskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">Ask your documents</h1>
        <p className="mt-1 text-navy-500 dark:text-navy-400">Cited answers from the text — never guessed.</p>
      </div>
      <Suspense fallback={<p className="text-navy-400">Loading…</p>}>
        <AskInner />
      </Suspense>
    </div>
  );
}
