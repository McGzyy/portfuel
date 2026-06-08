"use client";

import { useMemo, useState } from "react";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import {
  buildJournalPriceLines,
  buildJournalScenarioPriceLines,
} from "@/lib/charts/price-lines";
import type { CandlePoint, ChartMarker, PriceLine } from "@/lib/charts/types";
import type { AssetClass } from "@/lib/market/validate-symbol";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";
import { cn } from "@/lib/utils";

type LevelKey = "entry" | "target" | "stop" | "bull" | "base" | "bear";

const LEVEL_TOGGLE: {
  key: LevelKey;
  label: string;
  matchLabel: string;
  defaultOn: boolean;
  color: string;
}[] = [
  { key: "entry", label: "Entry", matchLabel: "Plan entry", defaultOn: true, color: "#6366f1" },
  { key: "target", label: "Target", matchLabel: "Plan target", defaultOn: true, color: "#059669" },
  { key: "stop", label: "Stop", matchLabel: "Plan stop", defaultOn: true, color: "#dc2626" },
  { key: "bull", label: "Bull", matchLabel: "Bull case", defaultOn: false, color: "#d97706" },
  { key: "base", label: "Base", matchLabel: "Base case", defaultOn: false, color: "#64748b" },
  { key: "bear", label: "Bear", matchLabel: "Bear case", defaultOn: false, color: "#be123c" },
];

function lineKey(line: PriceLine): LevelKey | null {
  const row = LEVEL_TOGGLE.find((t) => t.matchLabel === line.label);
  return row?.key ?? null;
}

export function JournalPrivateChart({
  symbol,
  journal,
  candles,
  assetClass,
  markers,
  proUnlocked,
  journalMarkerCount,
}: {
  symbol: string;
  journal: WatchlistJournal;
  candles: CandlePoint[];
  assetClass: AssetClass;
  markers: ChartMarker[];
  proUnlocked: boolean;
  journalMarkerCount: number;
}) {
  const allLines = useMemo(
    () => [...buildJournalPriceLines(journal), ...buildJournalScenarioPriceLines(journal)],
    [journal]
  );

  const availableToggles = useMemo(
    () => LEVEL_TOGGLE.filter((t) => allLines.some((l) => l.label === t.matchLabel)),
    [allLines]
  );

  const [visibleLevels, setVisibleLevels] = useState<Set<LevelKey>>(() => {
    const defaults = new Set<LevelKey>();
    for (const t of LEVEL_TOGGLE) {
      if (t.defaultOn && allLines.some((l) => l.label === t.matchLabel)) {
        defaults.add(t.key);
      }
    }
    return defaults;
  });

  const priceLines = useMemo(
    () =>
      allLines.filter((line) => {
        const key = lineKey(line);
        return key != null && visibleLevels.has(key);
      }),
    [allLines, visibleLevels]
  );

  function toggleLevel(key: LevelKey) {
    setVisibleLevels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div id="journal-chart" className="space-y-2">
      {availableToggles.length > 0 ? (
        <div className="pf-workspace-panel flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Plan levels
          </span>
          {availableToggles.map((t) => {
            const on = visibleLevels.has(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleLevel(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  on
                    ? "border-[var(--pf-gray-300)] bg-[var(--pf-gray-50)] text-[var(--pf-black)]"
                    : "border-[var(--pf-border)] text-[var(--pf-gray-500)] opacity-60 hover:opacity-100"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                  aria-hidden
                />
                {t.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <TickerChartSection
        symbol={symbol}
        initialCandles={candles}
        assetClass={assetClass}
        markers={markers}
        priceLines={priceLines}
        proUnlocked={proUnlocked}
        title="Private chart"
        subtitle="Indigo dots mark each journal entry at that day's price — click a dot to jump to the note."
        journalMarkerCount={journalMarkerCount}
      />
    </div>
  );
}
