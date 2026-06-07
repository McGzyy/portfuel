import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { JournalNextUp } from "@/lib/journal/next-up";

export function JournalContinueCard({ nextUp }: { nextUp: JournalNextUp }) {
  return (
    <Link
      href={nextUp.href}
      className="pf-continue-card group block rounded-[var(--pf-radius-lg)] border px-5 py-4 shadow-[var(--pf-shadow-sm)] transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-red)]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            Up next in your journal
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-[var(--foreground)]">{nextUp.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-600)]">{nextUp.detail}</p>
        </div>
        <span className="pf-accent-btn inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors">
          {nextUp.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}
