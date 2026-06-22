"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { ShadowPerformanceStats } from "@/lib/desk-discovery/shadow-calls";
import { cn, formatPct } from "@/lib/utils";

const SIGNAL_LABELS: Record<string, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
  community_heat: "Community",
  recent_filing: "Filing",
};

export function DiscoveryShadowStatsPanel() {
  const [stats, setStats] = useState<ShadowPerformanceStats | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/desk-discovery?shadowStats=1");
        const json = await res.json();
        if (!cancelled) setStats(json.shadowStats ?? null);
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (stats === undefined) {
    return (
      <p className="text-xs text-[var(--pf-gray-400)]">Loading paper track record…</p>
    );
  }

  if (!stats || stats.totalClosed === 0) {
    return (
      <p className="text-xs leading-relaxed text-[var(--pf-gray-500)]">
        Paper calls open when AI drafts fire. Closed shadows appear here so you can tune scoring
        before publishing.
      </p>
    );
  }

  const topSignals = stats.bySignalType.filter((s) => s.count >= 2).slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--pf-black)]">
            {stats.totalClosed} closed ·{" "}
            {stats.winRate != null ? `${Math.round(stats.winRate * 100)}% win` : "—"}
            {stats.avgReturnPct != null ? ` · ${formatPct(stats.avgReturnPct)} avg` : ""}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--pf-gray-500)]">Paper desk · last 120 days</p>
        </div>
      </div>

      {topSignals.length > 0 ? (
        <ul className="space-y-1.5">
          {topSignals.map((row) => (
            <li
              key={row.type}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="font-medium text-[var(--pf-gray-600)]">
                {SIGNAL_LABELS[row.type] ?? row.type}
              </span>
              <span
                className={cn(
                  "tabular-nums font-semibold",
                  row.avgReturnPct != null && row.avgReturnPct >= 0
                    ? "text-emerald-600"
                    : row.avgReturnPct != null
                      ? "text-rose-600"
                      : "text-[var(--pf-gray-400)]"
                )}
              >
                {row.winRate != null ? `${Math.round(row.winRate * 100)}%` : "—"}
                {row.avgReturnPct != null ? ` · ${formatPct(row.avgReturnPct)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {stats.publishedVsShadow.publishedCount > 0 ? (
        <p className="text-[10px] text-[var(--pf-gray-500)]">
          Published: {stats.publishedVsShadow.publishedWinRate != null
            ? `${Math.round(stats.publishedVsShadow.publishedWinRate * 100)}% win`
            : "—"}{" "}
          vs paper{" "}
          {stats.publishedVsShadow.shadowWinRate != null
            ? `${Math.round(stats.publishedVsShadow.shadowWinRate * 100)}%`
            : "—"}
        </p>
      ) : null}
    </div>
  );
}
