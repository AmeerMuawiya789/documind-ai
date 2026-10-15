import type { Metadata } from "next";
import { ShieldCheck, Lock, EyeOff, KeyRound, Server, FileWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Security & Privacy" };

const ITEMS = [
  {
    icon: Lock,
    title: "Private storage, per-user access",
    text: "Uploaded files live in private storage buckets. Row-level security and storage policies ensure you can only ever access your own documents — enforced in the database, not just the UI.",
  },
  {
    icon: EyeOff,
    title: "Never used for training",
    text: "Your documents are never used to train AI models. They are processed only to answer your requests.",
  },
  {
    icon: KeyRound,
    title: "Secrets stay server-side",
    text: "AI provider keys and service credentials live in server-side environment variables. They never appear in browser code, URLs, or logs.",
  },
  {
    icon: ShieldCheck,
    title: "Injection-resistant prompts",
    text: "Document contents are treated as untrusted data. System prompts instruct the model to treat file text as evidence to quote — never as instructions to follow.",
  },
  {
    icon: Server,
    title: "Minimal data, clear deletion",
    text: "We store what the product needs: your account, your files, and your generated outputs. Delete a document and its chunks, conversations and files go with it. Delete your account and everything goes.",
  },
  {
    icon: FileWarning,
    title: "Honest limitations",
    text: "We don't claim certifications we haven't earned. See our security practices and known limitations documented openly in the repository.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">Security & privacy</h1>
        <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
          Your documents are your business. Here's how we keep them that way.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <item.icon className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-base font-semibold text-navy-900 dark:text-navy-100">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-500 dark:text-navy-400">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-12">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-100">Third-party AI processing</h2>
          <p className="mt-2 leading-relaxed text-navy-500 dark:text-navy-400">
            To answer questions and generate summaries, the text of documents you
            choose to process is sent to our configured AI provider over encrypted
            connections. Only the text needed for your request is sent — never
            your other documents, and never your credentials. You can review and
            delete your data at any time from Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
