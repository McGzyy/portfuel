import Link from "next/link";

export function CompareCommandHeader({
  symbolCount,
  watchlistCount,
}: {
  symbolCount: number;
  watchlistCount: number;
}) {
  const line =
    symbolCount >= 2
      ? `Comparing ${symbolCount} symbol${symbolCount === 1 ? "" : "s"} on a normalized % scale (3-month window).`
      : watchlistCount > 0
        ? `Pick 2–3 symbols — your watchlist has ${watchlistCount} name${watchlistCount === 1 ? "" : "s"} ready.`
        : "Add at least two tickers to see how they move together.";

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Pro Intelligence · Compare
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Ticker compare
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{line}</p>
          <Link
            href="/dashboard/watchlist"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ← Watchlist
          </Link>
        </div>
      </div>
    </header>
  );
}
