import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquareText, FileText, TableProperties, GitCompareArrows,
  ShieldCheck, UploadCloud, Search, Tags, History, Download, Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Features" };

const GROUPS: { heading: string; items: { icon: typeof Search; title: string; text: string }[] }[] = [
  {
    heading: "Understand",
    items: [
      { icon: MessageSquareText, title: "Document Q&A with citations", text: "Ask in plain language. Answers quote the exact passages and page numbers they came from — and say so when the document lacks the answer." },
      { icon: FileText, title: "Seven summary formats", text: "Short overview, detailed, bullet points, key findings, dates & names, action items, and executive summary. Copy or download any of them." },
      { icon: History, title: "Conversation history", text: "Every chat is saved per document. Pick up where you left off or start a fresh thread any time." },
    ],
  },
  {
    heading: "Extract & compare",
    items: [
      { icon: TableProperties, title: "Structured data extraction", text: "Define the fields you need — dates, amounts, names, deadlines — and get validated JSON-style results with supporting quotes." },
      { icon: GitCompareArrows, title: "Side-by-side comparison", text: "Compare two documents: similarities, differences, changed dates and amounts, missing sections, and a concise report." },
      { icon: Download, title: "Export anywhere", text: "Copy results to your clipboard or download them for reports, spreadsheets and records." },
    ],
  },
  {
    heading: "Organize & trust",
    items: [
      { icon: UploadCloud, title: "Secure uploads", text: "PDF, DOCX, TXT, MD and CSV up to 20 MB. Files are validated, stored privately, and never visible to other users." },
      { icon: Search, title: "Search, filter & tags", text: "Find documents instantly with full-text search, status filters, sorting and pagination." },
      { icon: ShieldCheck, title: "Private by design", text: "Per-user access control, private storage buckets, and a strict no-training policy on your documents." },
    ],
  },
  {
    heading: "Built for real work",
    items: [
      { icon: Tags, title: "Usage transparency", text: "See exactly how many questions, summaries and extractions you've used each month." },
      { icon: Languages, title: "Works in your language", text: "Upload documents and ask questions in the language your documents are written in." },
      { icon: FileText, title: "Mobile responsive", text: "Full functionality on phone, tablet and desktop — review documents anywhere." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">Features</h1>
        <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
          A complete toolkit for working with documents — grounded in your files, never guessed.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.heading} className="mt-14" aria-label={group.heading}>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">{group.heading}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {group.items.map((f) => (
              <Card key={f.title}>
                <CardContent className="p-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                    <f.icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-navy-900 dark:text-navy-100">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500 dark:text-navy-400">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-16 text-center">
        <Button size="lg" variant="gradient" asChild>
          <Link href="/sign-up">Try every feature free <ArrowRight className="size-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
