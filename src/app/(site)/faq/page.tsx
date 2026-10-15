import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "FAQ" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "What file types can I upload?",
    a: "PDF, Word (.docx), plain text (.txt), Markdown (.md) and CSV files up to 20 MB. Encrypted or password-protected PDFs are rejected with a clear message.",
  },
  {
    q: "How do cited answers work?",
    a: "Your document is split into passages and indexed. When you ask a question, the most relevant passages are retrieved and the AI answers using only those passages — citing each one with page numbers and excerpts you can check.",
  },
  {
    q: "What happens if the document doesn't contain the answer?",
    a: "The assistant says so explicitly instead of guessing. You'll see a message like “The document doesn't contain enough information to answer that.”",
  },
  {
    q: "Are my documents used to train AI models?",
    a: "No. Documents are processed only to fulfill your requests and are never used for model training.",
  },
  {
    q: "Can other users see my documents?",
    a: "No. Files live in private storage and every database query is scoped to your account with row-level security enforced in Postgres.",
  },
  {
    q: "What about scanned PDFs?",
    a: "If a PDF contains almost no embedded text (typical of scanned images), we flag it honestly. Built-in OCR is on the roadmap; until then, text-based PDFs work best.",
  },
  {
    q: "How do monthly limits work?",
    a: "Each plan includes monthly quotas for questions, summaries, extractions and comparisons. They reset on the first of each month (UTC) and don't roll over.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Deleting a document removes its file, text chunks, and derived outputs. You can delete your entire account — and everything with it — from Settings.",
  },
  {
    q: "Is DocuMind AI a replacement for professional advice?",
    a: "No. Summaries and answers reflect document contents and can contain errors. Always verify critical details — especially legal, medical, or financial ones — with a qualified professional.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">Frequently asked questions</h1>
      <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
        Everything else you're wondering, answered plainly.
      </p>

      <div className="mt-10 space-y-4">
        {FAQS.map((f) => (
          <Card key={f.q}>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-navy-900 dark:text-navy-100">{f.q}</h2>
              <p className="mt-2 leading-relaxed text-navy-500 dark:text-navy-400">{f.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-navy-500 dark:text-navy-400">Still curious?</p>
        <Button className="mt-4" asChild>
          <Link href="/contact">Contact support <ArrowRight className="size-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
