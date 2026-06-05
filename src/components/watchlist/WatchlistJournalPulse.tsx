import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { JournalHighlightRow } from "@/lib/watchlist/journal-highlights";
import { formatPrice } from "@/lib/utils";

export function WatchlistJournalPulse({ ideas }: { ideas: JournalHighlightRow[] }) {
  if (ideas.length === 0) return null;

  return (
    <section className="pf-workspace-panel px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-indigo-600" strokeWidth={2.25} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Journal · Best ideas
        </p>
      </div>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        High conviction (8+) symbols you&apos;re still watching — open the journal to review thesis
        and scenarios.
      </p>
      <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {ideas.map((idea) => (
          <li key={idea.symbol}>
            <Link
              href={`/dashboard/watchlist/${idea.symbol}`}
              className="flex min-w-[10rem] flex-col rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                  {idea.symbol}
                </span>
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                  {idea.conviction}/10
                </span>
              </span>
              {idea.last_price != null ? (
                <span className="mt-0.5 text-[10px] tabular-nums text-[var(--pf-gray-500)]">
                  ${formatPrice(idea.last_price)}
                  {idea.base_case_price != null ? (
                    <span className="ml-1 text-[var(--pf-gray-400)]">
                      · base ${formatPrice(idea.base_case_price)}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/watchlist"
        className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
      >
        Full watchlist →
      </Link>
    </section>
  );
}
