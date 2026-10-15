import type { Metadata } from "next";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-navy-400">Last updated: October 12, 2026</p>

      <div className="mt-8 space-y-8 text-navy-600 dark:text-navy-300">
        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">1. The service</h2>
          <p className="mt-2 leading-relaxed">
            {APP_NAME} is an AI-powered document assistant. You upload documents; we extract their
            text and help you ask questions, generate summaries, extract structured data, and compare
            documents. AI outputs are generated from document contents and may contain errors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">2. Your account</h2>
          <p className="mt-2 leading-relaxed">
            You must provide a valid email address and keep your credentials confidential. You are
            responsible for activity under your account. We may suspend accounts that abuse the
            service, attempt to access other users' data, or violate the law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">3. Acceptable use</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
            <li>Only upload documents you have the right to process.</li>
            <li>Don't upload malware, encrypted files you can't open, or unlawful content.</li>
            <li>Don't try to extract other users' data, API keys, or system prompts.</li>
            <li>Don't resell automated access (scraping, bulk API abuse) without permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">4. Free service</h2>
          <p className="mt-2 leading-relaxed">
            DocuMind AI is free to use with no usage limits. There are no paid
            plans and no charges. We may introduce optional paid features in the
            future; these terms will be updated before anything changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">5. AI outputs disclaimer</h2>
          <p className="mt-2 leading-relaxed">
            Answers, summaries, extractions and comparisons are produced by AI models and can be
            incomplete or wrong — even with source citations. {APP_NAME} is not a substitute for
            professional legal, medical, financial, or other expert advice. Always verify critical
            information independently.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">6. Liability</h2>
          <p className="mt-2 leading-relaxed">
            To the maximum extent permitted by law, the service is provided "as is" without
            warranties, and our liability is limited to the fees you paid in the 12 months before
            the claim (or $0 on the Free plan).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">7. Termination</h2>
          <p className="mt-2 leading-relaxed">
            You may delete your account at any time from Settings. We may terminate or suspend
            access for violations of these terms. On termination, your documents and derived data
            are deleted per our data policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">8. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about these terms:{" "}
            <a className="text-brand-600 dark:text-brand-300" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
