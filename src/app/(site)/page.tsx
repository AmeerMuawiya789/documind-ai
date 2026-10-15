import Link from "next/link";
import {
  MessageSquareText, FileText, TableProperties, GitCompareArrows,
  ShieldCheck, Zap, UploadCloud, ArrowRight, Check, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/config";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Ask your documents",
    text: "Chat with PDFs, Word and text files. Every answer cites the exact passages it came from — or tells you when the document doesn't contain the answer.",
  },
  {
    icon: FileText,
    title: "Instant summaries",
    text: "Seven formats from quick overviews to executive summaries, key findings, dates & names, and action items. Copy or download in one click.",
  },
  {
    icon: TableProperties,
    title: "Structured extraction",
    text: "Pull dates, amounts, names, deadlines and any custom fields into clean structured data — with the supporting quote attached to each fact.",
  },
  {
    icon: GitCompareArrows,
    title: "Document comparison",
    text: "Put two versions side by side and get similarities, differences, changed figures and missing sections in a concise report.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Files live in private storage with per-user access control. Your documents are never used to train models.",
  },
  {
    icon: Zap,
    title: "Fast & simple",
    text: "Upload in seconds, ask in plain language. No setup, no technical skills needed — it works on any device.",
  },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload", text: "Drop in a PDF, DOCX or TXT file (up to 20 MB). Text is extracted and indexed automatically." },
  { icon: MessageSquareText, title: "Ask or generate", text: "Chat with citations, or generate a summary, extraction or comparison in seconds." },
  { icon: Check, title: "Verify & use", text: "Every answer links back to its source passages so you can trust — and verify — the result." },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-navy-900 dark:via-navy-950 dark:to-navy-950"
        />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
          <Badge className="animate-rise mb-6" variant="default">
            AI document assistant for busy people
          </Badge>
          <h1 className="animate-rise animate-rise-1 mx-auto max-w-3xl text-4xl font-bold tracking-tight text-navy-950 sm:text-5xl lg:text-6xl dark:text-white">
            Ask questions about your documents.{" "}
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              Get answers you can trust.
            </span>
          </h1>
          <p className="animate-rise animate-rise-2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-500 dark:text-navy-400">
            {APP_NAME} reads your PDFs, Word and text documents, then answers
            questions with cited sources, writes summaries, extracts structured
            data, and compares versions — in seconds.
          </p>
          <div className="animate-rise animate-rise-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/sign-up">
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="animate-rise animate-rise-4 mt-4 text-sm text-navy-400">
            Free plan · No credit card · 2-minute setup
          </p>

          {/* Product mock */}
          <div className="animate-rise animate-rise-4 mx-auto mt-14 max-w-3xl text-left">
            <Card className="overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 border-b border-navy-100 bg-navy-50/60 px-4 py-3 dark:border-navy-800 dark:bg-navy-800/60">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-amber-400" />
                <span className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-navy-400">contract-v3.pdf — Ask</span>
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm text-white">
                  What is the termination notice period?
                </div>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-navy-50 px-4 py-3 text-sm leading-relaxed text-navy-800 dark:bg-navy-800 dark:text-navy-200">
                  Either party may terminate with <strong>30 days written notice</strong> [1].
                  Termination for cause requires a 15-day cure period [2].
                  <div className="mt-3 space-y-1.5 border-t border-navy-100 pt-3 text-xs text-navy-500 dark:border-navy-800 dark:text-navy-400">
                    <p><span className="font-semibold text-brand-700 dark:text-brand-300">[1]</span> p. 4 — “…thirty (30) days written notice…”</p>
                    <p><span className="font-semibold text-brand-700 dark:text-brand-300">[2]</span> p. 5 — “…fifteen (15) day cure period…”</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="text-center">
          <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl dark:text-white">
            Everything you need to understand documents faster
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-navy-500 dark:text-navy-400">
            Built for researchers, consultants, freelancers and small businesses
            who live inside documents.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-lg">
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

      {/* How it works */}
      <section className="border-y border-navy-100 bg-navy-50/60 dark:border-navy-800 dark:bg-navy-900/40" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 id="how-heading" className="text-center text-3xl font-bold tracking-tight text-navy-950 dark:text-white">
            From upload to insight in three steps
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Card key={s.title}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-300">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-navy-900 dark:text-navy-100">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500 dark:text-navy-400">{s.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Free forever */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="free-heading">
        <div className="rounded-3xl border border-navy-100 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10 p-10 text-center dark:border-navy-800 sm:p-14">
          <h2 id="free-heading" className="text-3xl font-bold tracking-tight text-navy-950 dark:text-white">
            Free forever. No plans, no limits.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-500 dark:text-navy-400">
            Every feature is unlocked for everyone — unlimited documents, questions,
            summaries, comparisons and extractions. No credit card, no paywall.
          </p>
          <Button className="mt-8" variant="gradient" size="lg" asChild>
            <Link href="/sign-up">Start using it free</Link>
          </Button>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-navy-100 bg-navy-50/60 dark:border-navy-800 dark:bg-navy-900/40" aria-label="Testimonials">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { q: "I review 40-page vendor contracts weekly. DocuMind pulls the termination and liability clauses in seconds — with page numbers.", n: "Consultant, procurement" },
              { q: "Literature reviews used to take me days. Now I ask each paper the same questions and compare the answers.", n: "PhD researcher" },
              { q: "We extract invoice dates and amounts across hundreds of PDFs. The structured output drops straight into our spreadsheet.", n: "Small business owner" },
            ].map((t) => (
              <Card key={t.n}>
                <CardContent className="p-6">
                  <Quote className="size-6 text-brand-300" aria-hidden />
                  <p className="mt-3 text-sm leading-relaxed text-navy-700 dark:text-navy-300">“{t.q}”</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-navy-400">{t.n}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-navy-400">
            Illustrative examples of intended use cases.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900">
          <CardContent className="px-6 py-16 text-center sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stop skimming. Start asking.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-200">
              Upload your first document and get a cited answer in under a minute.
            </p>
            <Button size="lg" className="mt-8 bg-white text-navy-900 hover:bg-navy-50" asChild>
              <Link href="/sign-up">
                Create your free account <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
