"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark theme"
      title="Toggle dark theme"
      className={cn(
        "flex size-10 items-center justify-center rounded-xl text-navy-600 transition-all",
        "hover:bg-navy-100 hover:text-navy-900",
        "dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        className,
      )}
    >
      {/* Icon visibility is pure CSS (.dark on <html>) — no hydration mismatch. */}
      <span className="relative block size-5" aria-hidden>
        <Sun className="absolute inset-0 size-5 transition-all duration-300 dark:rotate-90 dark:scale-0 dark:opacity-0" />
        <Moon className="absolute inset-0 size-5 -rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100" />
      </span>
    </button>
  );
}
