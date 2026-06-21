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
      <div
        className={
          embedded
            ? "flex flex-col gap-2 sm:flex-row sm:flex-wrap"
            : "mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        }
      >
        {tickers.map((t) => (
          <Link
            key={t.symbol}
            href={`/ticker/${t.symbol}`}
            className="pf-hot-ticker-chip w-full sm:w-auto"
          >
            <MiniSparkline
              points={series[t.symbol] ?? []}
              trendUp={t.avgReturnPct != null ? t.avgReturnPct >= 0 : null}
            />
            <span className="font-mono text-[var(--pf-black)]">{t.symbol}</span>
            <span className="tabular-nums text-[var(--pf-gray-400)]">
              {t.callCount} call{t.callCount === 1 ? "" : "s"}
            </span>
            {t.avgReturnPct != null ? (
              <span
                className={`tabular-nums ${
                  t.avgReturnPct >= 0 ? "pf-return-up" : "pf-return-down"
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
