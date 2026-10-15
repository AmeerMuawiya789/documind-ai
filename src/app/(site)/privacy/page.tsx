import type { Metadata } from "next";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-navy-400">Last updated: October 12, 2026</p>

      <div className="prose-doc mt-8 space-y-8 text-navy-600 dark:text-navy-300">
        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">1. What we collect</h2>
          <p className="mt-2 leading-relaxed">
            <strong className="text-navy-800 dark:text-navy-200">Account data:</strong> your email address and optional
            display name, needed to operate your account.
          </p>
          <p className="mt-2 leading-relaxed">
            <strong className="text-navy-800 dark:text-navy-200">Your documents:</strong> files you upload, their
            extracted text, and the outputs you generate (summaries, answers, extractions, comparisons).
          </p>
          <p className="mt-2 leading-relaxed">
            <strong className="text-navy-800 dark:text-navy-200">Usage data:</strong> counts of AI operations and
            approximate token usage, used to enforce plan limits and monitor costs. We never log
            document contents, passwords, or payment secrets.
          </p>
          <p className="mt-2 leading-relaxed">
            <strong className="text-navy-800 dark:text-navy-200">Payment data:</strong> processed by Paddle. We store
            only subscription status and identifiers — never card numbers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">2. How we use it</h2>
          <p className="mt-2 leading-relaxed">
            To provide the service you asked for: storing your documents, answering your questions,
            and generating the outputs you request. Document text you choose to process is sent to
            our configured AI provider over encrypted connections, solely to fulfill your request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">3. What we never do</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
            <li>Never use your documents to train AI models.</li>
            <li>Never sell your personal data or document contents.</li>
            <li>Never show your documents to other users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">4. Sharing</h2>
          <p className="mt-2 leading-relaxed">
            We share data only with infrastructure providers necessary to run {APP_NAME}
            (hosting, database, AI inference, payments), bound by their own privacy obligations.
            We disclose data if required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">5. Your controls</h2>
          <p className="mt-2 leading-relaxed">
            Delete any document at any time — its file, text index, and derived outputs are removed.
            Delete your account from Settings to remove everything associated with it. Contact{" "}
            <a className="text-brand-600 dark:text-brand-300" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{" "}
            for export or correction requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">6. Security</h2>
          <p className="mt-2 leading-relaxed">
            Files are stored in private buckets with per-user access policies; database access is
            restricted by row-level security; secrets are kept server-side. No system is perfectly
            secure, and we document our practices and limitations openly rather than claiming
            certifications we haven't earned.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">7. Changes</h2>
          <p className="mt-2 leading-relaxed">
            We'll update this page when our practices change and note the revision date above.
          </p>
        </section>
      </div>
    </div>
  );
}
