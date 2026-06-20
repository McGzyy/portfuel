"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import type { CommunityScreenerData, ScreenerAssetFilter } from "@/lib/screener/community-shared";
import { filterScreenerByAsset } from "@/lib/screener/community-shared";
import { cn, formatPct } from "@/lib/utils";

type ScreenerView = "activity" | "progress" | "desk" | "conviction";
type BarSort = "value-desc" | "value-asc" | "symbol-asc";

const BAR_SORT_OPTIONS: { id: BarSort; label: string }[] = [
  { id: "value-desc", label: "Top values" },
  { id: "value-asc", label: "Low values" },
  { id: "symbol-asc", label: "A → Z" },
];

function sortBarItems<T extends { label: string; value: number }>(items: T[], sort: BarSort): T[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "symbol-asc") return a.label.localeCompare(b.label);
    if (sort === "value-asc") return a.value - b.value;
    return b.value - a.value;
  });
  return copy;
}

function BarSortControls({
  value,
  onChange,
}: {
  value: BarSort;
  onChange: (next: BarSort) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {BAR_SORT_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
            value === opt.id
              ? "border-[var(--pf-red)] bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
              : "border-[var(--pf-border)] text-[var(--pf-gray-500)] hover:border-[var(--pf-gray-300)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const TABS: { id: ScreenerView; label: string; hint: string }[] = [
  { id: "activity", label: "Activity", hint: "Most called & best returns" },
  { id: "progress", label: "Target progress", hint: "Closest to target" },
  { id: "desk", label: "Desk vs crowd", hint: "Where house disagrees" },
  { id: "conviction", label: "Conviction", hint: "Highest vote symbols" },
];

export function ScreenerChartPanels({ data }: { data: CommunityScreenerData }) {
  const [view, setView] = useState<ScreenerView>("activity");
  const [assetFilter, setAssetFilter] = useState<ScreenerAssetFilter>("all");
  const [barSort, setBarSort] = useState<BarSort>("value-desc");

  const filtered = useMemo(
    () => filterScreenerByAsset(data, assetFilter),
    [data, assetFilter]
  );

  const mostCalledBars = filtered.mostCalled.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: r.callCount,
    href: `/ticker/${r.symbol}`,
    sublabel: `${r.latestDirection} · best ${formatPct(r.bestReturnPct)}`,
    valueLabel: `${r.callCount} call${r.callCount === 1 ? "" : "s"}`,
  }));

  const topReturnBars = filtered.topReturns.map((r, i) => ({
    id: `${r.symbol}-${i}`,
    label: r.symbol,
    value: Math.max(0, r.return_pct),
    href: `/ticker/${r.symbol}`,
    sublabel: `@${r.username} · ${r.direction}`,
    valueLabel: formatPct(r.return_pct),
  }));

  const progressBars = filtered.targetProgress.map((r, i) => ({
    id: `${r.symbol}-${i}`,
    label: r.symbol,
    value: Math.min(100, Math.max(0, r.target_progress)),
    href: `/ticker/${r.symbol}`,
    sublabel: `@${r.username} · ${r.direction} · ${formatPct(r.return_pct)}`,
    valueLabel: `${Math.round(r.target_progress)}%`,
  }));

  const deskBars = filtered.deskVsCrowd.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: r.communityCalls,
    href: `/ticker/${r.symbol}`,
    sublabel: r.diverges
      ? `Crowd ${r.communityLongPct}% long · Desk ${r.deskDirection}`
      : `Aligned · Desk ${r.deskDirection}`,
    valueLabel: r.diverges ? "Diverges" : "Aligned",
  }));

  const convictionBars = filtered.highConviction.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: Math.max(0, r.voteScore),
    href: `/ticker/${r.symbol}`,
    sublabel: `${r.callCount} call${r.callCount === 1 ? "" : "s"} · ${r.latestDirection}`,
    valueLabel: `${r.voteScore} votes`,
  }));

  const sortedMostCalled = useMemo(
    () => sortBarItems(mostCalledBars, barSort),
    [mostCalledBars, barSort]
  );
  const sortedTopReturns = useMemo(
    () => sortBarItems(topReturnBars, barSort),
    [topReturnBars, barSort]
  );
  const sortedProgress = useMemo(
    () => sortBarItems(progressBars, barSort),
    [progressBars, barSort]
  );
  const sortedDesk = useMemo(() => sortBarItems(deskBars, barSort), [deskBars, barSort]);
  const sortedConviction = useMemo(
    () => sortBarItems(convictionBars, barSort),
    [convictionBars, barSort]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "equity", "crypto"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setAssetFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors",
              assetFilter === key
                ? "pf-pill-active border"
                : "pf-pill-inactive border hover:border-[var(--pf-gray-300)]"
            )}
          >
            {key === "all" ? "All assets" : key}
          </button>
        ))}
      </div>
      <BarSortControls value={barSort} onChange={setBarSort} />
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--pf-border)] pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2 text-left transition-colors whitespace-nowrap",
              view === tab.id
                ? "border-[var(--pf-red)] text-[var(--pf-black)]"
                : "border-transparent text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
            )}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="block text-[10px] font-medium text-[var(--pf-gray-400)]">
              {tab.hint}
            </span>
          </button>
        ))}
      </div>

      {view === "activity" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartFrame
            title="Most called"
            subtitle="Symbols with the most new member theses · 7 days"
          >
            <HorizontalBarChart items={sortedMostCalled} maxItems={10} />
          </ChartFrame>
          <ChartFrame
            title="Best returns"
            subtitle="Top performing member calls · 30 days"
          >
            <HorizontalBarChart
              items={sortedTopReturns}
              maxItems={10}
              valueFormatter={(v) => formatPct(v)}
            />
          </ChartFrame>
        </div>
      ) : null}

      {view === "progress" ? (
        <ChartFrame
          title="Target progress leaders"
          subtitle="Open member theses closest to target · 30 days"
        >
          {progressBars.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--pf-gray-500)]">
              No calls with target progress yet — publish theses with entry and target levels.
            </p>
          ) : (
            <HorizontalBarChart items={sortedProgress} maxItems={12} valueFormatter={(v) => `${Math.round(v)}%`} />
          )}
        </ChartFrame>
      ) : null}

      {view === "desk" ? (
        <ChartFrame
          title="Desk vs crowd"
          subtitle="Symbols where Fueled desk and member lean diverge · 30 days"
        >
          {deskBars.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--pf-gray-500)]">
              Need both Fueled desk calls and member activity on the same symbols.
            </p>
          ) : (
            <HorizontalBarChart items={sortedDesk} maxItems={12} />
          )}
        </ChartFrame>
      ) : null}

      {view === "conviction" ? (
        <ChartFrame
          title="High conviction"
          subtitle="Symbols with the most community votes · 7 days"
        >
          {convictionBars.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--pf-gray-500)]">
              Vote on member theses to build conviction signals.
            </p>
          ) : (
            <HorizontalBarChart items={sortedConviction} maxItems={12} />
          )}
        </ChartFrame>
      ) : null}
    </div>
  );
}
