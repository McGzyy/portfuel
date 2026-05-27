"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { LinePoint } from "@/lib/charts/types";

export type HotTicker = {
  symbol: string;
  callCount: number;
  avgReturnPct: number | null;
};

export function HotTickersStrip({
  tickers,
  embedded = false,
}: {
  tickers: HotTicker[];
  /** Hide outer label when inside WorkspacePanel */
  embedded?: boolean;
}) {
  const [series, setSeries] = useState<Record<string, LinePoint[]>>({});

  const symbolKey = useMemo(
    () => tickers.map((t) => t.symbol).join(","),
    [tickers]
  );

  useEffect(() => {
    if (tickers.length === 0) return;

    const controller = new AbortController();
    void fetch(`/api/market/sparklines?symbols=${encodeURIComponent(symbolKey)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { series?: Record<string, LinePoint[]> } | null) => {
        if (data?.series) setSeries(data.series);
      })
      .catch(() => {
        /* ignore */
      });

    return () => controller.abort();
  }, [symbolKey, tickers.length]);

  if (tickers.length === 0) return null;

  return (
    <section aria-label="Active tickers in feed">
      {!embedded ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Hot in feed
        </p>
      ) : null}
      <div className={embedded ? "flex flex-wrap gap-2" : "mt-2 flex flex-wrap gap-2"}>
        {tickers.map((t) => (
          <Link
            key={t.symbol}
            href={`/ticker/${t.symbol}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-[var(--pf-border)] bg-white py-1.5 pl-3 pr-3.5 text-xs font-semibold shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-200)] hover:bg-[var(--pf-gray-50)]"
          >
            <MiniSparkline points={series[t.symbol] ?? []} />
            <span className="font-mono text-[var(--pf-black)]">{t.symbol}</span>
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
