import Link from "next/link";

export type HotTicker = {
  symbol: string;
  callCount: number;
  avgReturnPct: number | null;
};

export function HotTickersStrip({ tickers }: { tickers: HotTicker[] }) {
  if (tickers.length === 0) return null;

  return (
    <section className="mt-4" aria-label="Active tickers in feed">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Hot in feed
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tickers.map((t) => (
          <Link
            key={t.symbol}
            href={`/ticker/${t.symbol}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--pf-border)] bg-white px-3 py-1.5 text-xs font-semibold shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-200)] hover:bg-[var(--pf-gray-50)]"
          >
            <span className="text-[var(--pf-black)]">{t.symbol}</span>
            <span className="tabular-nums text-[var(--pf-gray-400)]">
              {t.callCount} call{t.callCount === 1 ? "" : "s"}
            </span>
            {t.avgReturnPct != null ? (
              <span
                className={`tabular-nums ${
                  t.avgReturnPct >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {t.avgReturnPct >= 0 ? "+" : ""}
                {t.avgReturnPct.toFixed(1)}%
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
