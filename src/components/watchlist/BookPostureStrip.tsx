import Link from "next/link";
import { journalSymbolPath } from "@/lib/journal/paths";
import { summarizeBookPosture } from "@/lib/watchlist/book-posture";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { PositionIntentBadge } from "@/components/watchlist/PositionIntentBadge";

export function BookPostureStrip({ items }: { items: WatchlistEntry[] }) {
  const posture = summarizeBookPosture(items);
  if (posture.inBook === 0) return null;

  const parts: string[] = [];
  if (posture.active > 0) {
    parts.push(`${posture.active} active`);
  }
  if (posture.trimming > 0) {
    parts.push(`${posture.trimming} trimming`);
  }
  if (posture.building > 0) {
    parts.push(`${posture.building} building`);
  }

  return (
    <section className="pf-workspace-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Your book posture
          </p>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Private posture on your watchlist — not broker holdings.{" "}
            <span className="font-semibold text-[var(--pf-black)]">{parts.join(" · ")}</span>
          </p>
        </div>
        <Link
          href="/dashboard/watchlist"
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Watchlist →
        </Link>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {posture.rows.slice(0, 8).map((row) => (
          <li key={row.symbol}>
            <Link
              href={journalSymbolPath(row.symbol)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-1 text-xs font-semibold transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white"
            >
              <span className="font-mono text-[var(--pf-black)]">{row.symbol}</span>
              <PositionIntentBadge intent={row.intent} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
