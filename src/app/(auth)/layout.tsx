import { Logo } from "@/components/logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-navy-50/60 dark:bg-navy-950">
      <div className="flex justify-center pt-10">
        <Link href="/" aria-label="DocuMind AI home">
          <Logo />
        </Link>
      </div>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <p className="pb-8 text-center text-xs text-navy-400">
        Protected by email verification. Your documents stay private.
      </p>
    </div>
  );
}
