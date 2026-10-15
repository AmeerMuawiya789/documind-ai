import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/config";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-sm">
        <BrainCircuit className="size-5" aria-hidden />
      </span>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white">
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
