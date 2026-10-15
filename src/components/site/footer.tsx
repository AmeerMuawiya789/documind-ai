import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact & support" },
      { href: "/security", label: "Security & privacy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-navy-100 bg-navy-50/60 dark:border-navy-800 dark:bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-500 dark:text-navy-400">
              Ask questions, get summaries, and extract data from your
              documents — grounded in your files, never guessed.
            </p>
            <p className="mt-4 text-sm text-navy-500 dark:text-navy-400">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold text-navy-900 dark:text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-navy-500 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-navy-100 pt-8 sm:flex-row dark:border-navy-800">
          <p className="text-xs text-navy-400">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-navy-400">
            Your documents stay private — never used to train models.
          </p>
        </div>
      </div>
    </footer>
  );
}
