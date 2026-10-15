import type { Metadata } from "next";
import Link from "next/link";
import { UploadCloud, Scissors, MessageSquareText, BadgeCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  {
    icon: UploadCloud,
    title: "1. Upload your document",
    text: "Drag in a PDF, Word, text, Markdown or CSV file up to 20 MB. We validate the file, store it in your private vault, and extract its text automatically. You'll see a clear status — processing, ready, or a plain-language error if something's wrong.",
  },
  {
    icon: Scissors,
    title: "2. We index it for questions",
    text: "The text is split into passages and converted into search vectors, so questions find the most relevant sections — even in a 300-page report. Scanned PDFs with no embedded text are flagged honestly instead of pretending to work.",
  },
  {
    icon: MessageSquareText,
    title: "3. Ask, summarize, extract, compare",
    text: "Chat with cited answers, generate seven kinds of summaries, pull structured fields, or compare two versions. Every AI output is grounded in retrieved passages from your file.",
  },
  {
    icon: BadgeCheck,
    title: "4. Verify everything",
    text: "Answers cite their sources with page numbers and excerpts. If the document doesn't contain the answer, we say so instead of guessing. Your history is saved so you can revisit any insight.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">How it works</h1>
      <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
        Retrieval-augmented generation, explained without the jargon.
      </p>

      <div className="mt-12 space-y-6">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex gap-5 p-6 sm:p-8">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                <s.icon className="size-6" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-100">{s.title}</h2>
                <p className="mt-2 leading-relaxed text-navy-500 dark:text-navy-400">{s.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-10 border-brand-200 bg-brand-50/50">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-100">Why cited answers matter</h2>
          <p className="mt-2 leading-relaxed text-navy-600 dark:text-navy-300">
            Large language models can sound confident while being wrong. DocuMind AI
            constrains the model to your document's actual passages and shows you
            exactly which ones were used — so a wrong answer is easy to spot, and
            a right one is easy to trust.
          </p>
        </CardContent>
      </Card>

      <div className="mt-10 text-center">
        <Button size="lg" variant="gradient" asChild>
          <Link href="/sign-up">Try it free <ArrowRight className="size-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
