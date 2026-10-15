"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Files, MessageSquareText, FileText, GitCompareArrows,
  TableProperties, Gauge, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/documents", label: "My Documents", icon: Files },
  { href: "/app/ask", label: "Ask", icon: MessageSquareText },
  { href: "/app/summaries", label: "Summaries", icon: FileText },
  { href: "/app/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/app/extracted", label: "Extracted Data", icon: TableProperties },
  { href: "/app/usage", label: "Usage", icon: Gauge },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-4" aria-label="Application">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-navy-600 hover:bg-navy-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-navy-100 pt-4 dark:border-navy-800">
        <Button variant="ghost" className="w-full justify-start text-navy-600 dark:text-navy-300" onClick={signOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
        <div className="mt-2 flex items-center justify-between px-3.5">
          <span className="text-xs text-navy-400">Theme</span>
          <ThemeToggle className="size-9" />
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-navy-100 bg-white/90 px-4 backdrop-blur-md lg:hidden dark:border-navy-800 dark:bg-navy-950/90">
        <Link href="/app/dashboard" aria-label="Dashboard">
          <Logo showWordmark={false} />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="size-9" />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-navy-700 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-14 z-30 border-b border-navy-100 bg-white shadow-lg lg:hidden dark:border-navy-800 dark:bg-navy-950">
          {nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-navy-100 bg-white lg:flex dark:border-navy-800 dark:bg-navy-950">
        <div className="border-b border-navy-100 p-4 dark:border-navy-800">
          <Link href="/app/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-navy-100 p-4 dark:border-navy-800">
          <p className="text-xs text-navy-400">
            Documents are private to your account and never used for training.
          </p>
        </div>
      </aside>
    </>
  );
}
