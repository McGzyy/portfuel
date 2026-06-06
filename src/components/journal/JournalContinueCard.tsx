import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { JournalNextUp } from "@/lib/journal/next-up";

export function JournalContinueCard({ nextUp }: { nextUp: JournalNextUp }) {
  return (
    <Link
      href={nextUp.href}
      className="group block rounded-[var(--pf-radius-lg)] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white px-5 py-4 shadow-[var(--pf-shadow-sm)] transition-colors hover:border-indigo-300 hover:from-indigo-50"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            Up next in your journal
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-[var(--pf-black)]">{nextUp.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-600)]">{nextUp.detail}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-indigo-700">
          {nextUp.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}
