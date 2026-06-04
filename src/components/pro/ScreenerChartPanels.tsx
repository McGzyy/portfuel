"use client";

import { useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { cn, formatPct } from "@/lib/utils";

type ScreenerView = "activity" | "progress" | "desk" | "conviction";

const TABS: { id: ScreenerView; label: string; hint: string }[] = [
  { id: "activity", label: "Activity", hint: "Most called & best returns" },
  { id: "progress", label: "Target progress", hint: "Closest to target" },
  { id: "desk", label: "Desk vs crowd", hint: "Where house disagrees" },
  { id: "conviction", label: "Conviction", hint: "Highest vote symbols" },
];

export function ScreenerChartPanels({ data }: { data: CommunityScreenerData }) {
  const [view, setView] = useState<ScreenerView>("activity");

  const mostCalledBars = data.mostCalled.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: r.callCount,
    href: `/ticker/${r.symbol}`,
    sublabel: `${r.latestDirection} · best ${formatPct(r.bestReturnPct)}`,
    valueLabel: `${r.callCount} call${r.callCount === 1 ? "" : "s"}`,
  }));

  const topReturnBars = data.topReturns.map((r, i) => ({
    id: `${r.symbol}-${i}`,
    label: r.symbol,
    value: Math.max(0, r.return_pct),
    href: `/ticker/${r.symbol}`,
    sublabel: `@${r.username} · ${r.direction}`,
    valueLabel: formatPct(r.return_pct),
  }));

  const progressBars = data.targetProgress.map((r, i) => ({
    id: `${r.symbol}-${i}`,
    label: r.symbol,
    value: Math.min(100, Math.max(0, r.target_progress)),
    href: `/ticker/${r.symbol}`,
    sublabel: `@${r.username} · ${r.direction} · ${formatPct(r.return_pct)}`,
    valueLabel: `${Math.round(r.target_progress)}%`,
  }));

  const deskBars = data.deskVsCrowd.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: r.communityCalls,
    href: `/ticker/${r.symbol}`,
    sublabel: r.diverges
      ? `Crowd ${r.communityLongPct}% long · Desk ${r.deskDirection}`
      : `Aligned · Desk ${r.deskDirection}`,
    valueLabel: r.diverges ? "Diverges" : "Aligned",
  }));

  const convictionBars = data.highConviction.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: Math.max(0, r.voteScore),
    href: `/ticker/${r.symbol}`,
    sublabel: `${r.callCount} call${r.callCount === 1 ? "" : "s"} · ${r.latestDirection}`,
    valueLabel: `${r.voteScore} votes`,
  }));

  return (
    <div className="space-y-4">
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
            <HorizontalBarChart items={mostCalledBars} maxItems={10} />
          </ChartFrame>
          <ChartFrame
            title="Best returns"
            subtitle="Top performing member calls · 30 days"
          >
            <HorizontalBarChart
              items={topReturnBars}
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
            <HorizontalBarChart items={progressBars} maxItems={12} valueFormatter={(v) => `${Math.round(v)}%`} />
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
            <HorizontalBarChart items={deskBars} maxItems={12} />
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
            <HorizontalBarChart items={convictionBars} maxItems={12} />
          )}
        </ChartFrame>
      ) : null}
    </div>
  );
}
