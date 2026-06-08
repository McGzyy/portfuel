import { formatPrice } from "@/lib/utils";
import { outcomeLabel, scenarioProgress } from "@/lib/watchlist/journal-meta";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}% to target`;
}

export function WatchlistJournalScenarioStrip({ journal }: { journal: WatchlistJournal }) {
  const hasScenario =
    journal.bull_case_price != null ||
    journal.base_case_price != null ||
    journal.bear_case_price != null;

  if (!hasScenario && journal.last_price == null) return null;

  const progress = scenarioProgress(journal.last_price, journal);

  return (
    <section className="pf-workspace-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Expected outcomes
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Track bull / base / bear targets — compare to live price over time.
          </p>
        </div>
        <span className="rounded-full bg-[var(--pf-gray-100)] px-2.5 py-1 text-[10px] font-bold text-[var(--pf-gray-700)]">
          {outcomeLabel(journal.outcome)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Now
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-[var(--pf-black)]">
            {journal.last_price != null ? `$${formatPrice(journal.last_price)}` : "—"}
          </p>
        </div>
        {journal.bull_case_price != null ? (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Bull</p>
            <p className="mt-1 font-mono text-sm font-bold text-[var(--pf-black)]">
              ${formatPrice(journal.bull_case_price)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-amber-900">{fmtPct(progress.bull)}</p>
          </div>
        ) : null}
        {journal.base_case_price != null ? (
          <div className="pf-scenario-tile">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
              Base
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-[var(--pf-black)]">
              ${formatPrice(journal.base_case_price)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--pf-gray-600)]">
              {fmtPct(progress.base)}
            </p>
          </div>
        ) : null}
        {journal.bear_case_price != null ? (
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-800">Bear</p>
            <p className="mt-1 font-mono text-sm font-bold text-[var(--pf-black)]">
              ${formatPrice(journal.bear_case_price)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-rose-900">{fmtPct(progress.bear)}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
