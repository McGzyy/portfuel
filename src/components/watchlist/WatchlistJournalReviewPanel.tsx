import Link from "next/link";
import { AlertTriangle, BarChart3, Target } from "lucide-react";
import { journalSymbolPath } from "@/lib/journal/paths";
import type { JournalReviewSnapshot } from "@/lib/watchlist/journal-review";
import { formatPct, formatPrice } from "@/lib/utils";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--pf-black)]">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-[var(--pf-gray-500)]">{hint}</p> : null}
    </div>
  );
}

export function WatchlistJournalReviewPanel({
  review,
}: {
  review: JournalReviewSnapshot;
}) {
  const { stats, broken, tracking } = review;
  if (stats.total === 0) return null;

  const hasClosed = stats.closed_correct + stats.closed_incorrect > 0;

  return (
    <section className="pf-workspace-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" strokeWidth={2.25} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Journal review
            </p>
          </div>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Private accuracy — how your journal outcomes and plan levels are tracking (not your
            public call record).
          </p>
        </div>
        <Link
          href="/dashboard/settings?section=notifications"
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Alert settings →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <StatTile label="Active" value={String(stats.active)} hint="Watching / developing" />
        <StatTile
          label="With thesis"
          value={String(stats.with_thesis)}
          hint={`of ${stats.total} symbols`}
        />
        {hasClosed ? (
          <StatTile
            label="Journal win rate"
            value={
              stats.journal_win_rate_pct != null
                ? `${stats.journal_win_rate_pct}%`
                : "—"
            }
            hint={`${stats.closed_correct}W · ${stats.closed_incorrect}L closed`}
          />
        ) : (
          <StatTile label="Closed" value="—" hint="Mark outcomes on journal pages" />
        )}
        {stats.avg_conviction_correct != null ? (
          <StatTile
            label="Avg conv · wins"
            value={`${stats.avg_conviction_correct}/10`}
          />
        ) : null}
        {stats.invalidated + stats.closed_incorrect > 0 ? (
          <StatTile
            label="Broken ideas"
            value={String(stats.invalidated + stats.closed_incorrect)}
            hint="Review below"
          />
        ) : null}
        {stats.closed_early > 0 ? (
          <StatTile label="Closed early" value={String(stats.closed_early)} />
        ) : null}
      </div>

      {tracking.length > 0 ? (
        <div className="mt-5 border-t border-[var(--pf-border)] pt-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            <Target className="h-3.5 w-3.5" strokeWidth={2.25} />
            Plan progress (entry → target)
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {tracking.map((row) => (
              <li key={row.symbol}>
                <Link
                  href={journalSymbolPath(row.symbol)}
                  className="pf-pulse-card inline-flex flex-col px-3 py-2"
                >
                  <span className="font-mono text-xs font-bold text-[var(--pf-black)]">
                    {row.symbol}
                  </span>
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      (row.target_progress_pct ?? 0) >= 50
                        ? "pf-return-up"
                        : "text-[var(--pf-gray-600)]"
                    }`}
                  >
                    {row.target_progress_pct != null
                      ? `${row.target_progress_pct}% to target`
                      : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {broken.length > 0 ? (
        <div className="mt-5 border-t border-[var(--pf-border)] pt-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
            Broken ideas — revisit or archive
          </p>
          <ul className="mt-2 space-y-2">
            {broken.slice(0, 5).map((row) => (
              <li key={row.symbol}>
                <Link
                  href={journalSymbolPath(row.symbol)}
                  className="block rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2.5 transition-colors hover:border-rose-300 hover:bg-rose-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                      {row.symbol}
                    </span>
                    <span className="pf-outcome-badge text-rose-800">
                      {row.outcome_label}
                    </span>
                  </div>
                  {row.thesis?.trim() ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--pf-gray-600)]">
                      {row.thesis.trim()}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] tabular-nums text-[var(--pf-gray-500)]">
                    {row.last_price != null ? `$${formatPrice(row.last_price)}` : null}
                    {row.change_since_add_pct != null ? (
                      <span
                        className={
                          row.change_since_add_pct >= 0 ? " pf-return-up" : " pf-return-down"
                        }
                      >
                        {" "}
                        · {(row.change_since_add_pct >= 0 ? "+" : "") +
                          formatPct(row.change_since_add_pct)}{" "}
                        since add
                      </span>
                    ) : null}
                    {row.conviction != null ? (
                      <span className="text-[var(--pf-gray-400)]">
                        {" "}
                        · conviction {row.conviction}/10
                      </span>
                    ) : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {broken.length > 5 ? (
            <p className="mt-2 text-[10px] text-[var(--pf-gray-500)]">
              +{broken.length - 5} more — filter watchlist by outcome on each journal page.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
