import Link from "next/link";
import { JournalHeaderAction } from "@/components/journal/JournalHeaderAction";
import type { JournalNextUp } from "@/lib/journal/next-up";

const MAX_WATCHLIST = 24;

export function WatchlistCommandHeader({
  symbolCount,
  unreadAlerts,
  callsLast7d,
  nextUp,
}: {
  symbolCount: number;
  unreadAlerts: number;
  callsLast7d: number;
  nextUp?: JournalNextUp | null;
}) {
  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Research · Watchlist
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Watchlist
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {symbolCount} of {MAX_WATCHLIST} symbols on your watchlist — add names here to research
            in your journal, then publish a call when ready.
            {unreadAlerts > 0 ? (
              <span className="font-semibold text-[var(--pf-red)]">
                {" "}
                · {unreadAlerts} new call alert{unreadAlerts === 1 ? "" : "s"}
              </span>
            ) : null}
            {callsLast7d > 0 ? (
              <span className="text-[var(--pf-gray-400)]">
                {" "}
                · {callsLast7d} member call{callsLast7d === 1 ? "" : "s"} on your list (7d)
              </span>
            ) : null}
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ← Workspace overview
          </Link>
        </div>
        {nextUp && symbolCount > 0 ? <JournalHeaderAction nextUp={nextUp} /> : null}
      </div>
    </header>
  );
}
