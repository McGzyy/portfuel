"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import { ReturnLineChart } from "@/components/charts/ReturnLineChart";
import type { ChartRangeKey, ReturnChartPoint } from "@/lib/charts/types";
import { filterLineByRange } from "@/lib/charts/range";
import { computeMaxDrawdown } from "@/lib/charts/cumulative-return";
import { COPY } from "@/lib/copy";
import { cn, formatPct } from "@/lib/utils";

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down" | "neutral";
}) {
  return (
    <div className="pf-hero-stat rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 px-2.5 py-2 sm:min-w-[4.5rem] sm:rounded-xl sm:px-3 sm:py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)] sm:text-[10px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold tabular-nums tracking-tight sm:text-lg",
          accent === "up"
            ? "text-emerald-600"
            : accent === "down"
              ? "text-rose-600"
              : "text-[var(--pf-black)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function OverviewReturnHero({
  points,
  profileHref,
  winRate,
  rankScore,
  publishedCallCount = 0,
}: {
  points: ReturnChartPoint[];
  profileHref: string;
  winRate?: number | null;
  rankScore?: number | null;
  /** Total published calls — used when chart points are empty but calls exist. */
  publishedCallCount?: number;
}) {
  const [range, setRange] = useState<ChartRangeKey>("all");
  const filtered = useMemo(
    () => filterLineByRange(points, range) as ReturnChartPoint[],
    [points, range]
  );
  const drawdown = useMemo(() => computeMaxDrawdown(points), [points]);

  const last = points[points.length - 1]?.value;
  const lastAccent =
    last == null ? "neutral" : last >= 0 ? ("up" as const) : ("down" as const);
  const wins = points.filter((p) => p.outcome === "win").length;
  const losses = points.filter((p) => p.outcome === "loss").length;

  if (points.length === 0) {
    const hasCalls = publishedCallCount > 0;
    return (
      <section
        className="pf-overview-return-hero overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-6 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-7"
        aria-label="Your cumulative return"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Track record
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--pf-black)] sm:text-2xl">
              Your return over time
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              {hasCalls
                ? `${publishedCallCount} published call${publishedCallCount === 1 ? "" : "s"} on your book — return will plot after the first price mark.`
                : "Publish a call with entry, target, and stop — this chart builds a cumulative view as each thesis is marked to market."}
            </p>
          </div>
          {hasCalls ? (
            <Link
              href={profileHref}
              className="inline-flex items-center rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-2 text-xs font-semibold text-[var(--pf-black)] hover:bg-[var(--pf-gray-50)]"
            >
              View on profile →
            </Link>
          ) : (
            <Link
              href={COPY.newCallHref}
              className="inline-flex items-center rounded-full bg-[var(--pf-red)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--pf-red-dark)]"
            >
              {COPY.publishCallCta} →
            </Link>
          )}
        </div>
        <div className="mt-6 flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 text-center">
          <p className="text-sm text-[var(--pf-gray-500)]">
            {hasCalls ? "Waiting for return data on your call(s)." : "No published calls yet."}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--pf-gray-400)]">
            {hasCalls
              ? "Use Update prices on the feed, or open the ticker — marks refresh automatically for Pro."
              : "Wins and drawdowns will stack here in call order — click any marker to jump to the ticker."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="pf-overview-return-hero overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] shadow-[var(--pf-shadow-sm)]"
      aria-label="Your cumulative return"
    >
      <div className="border-b border-[var(--pf-border)] px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Track record
            </p>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              Cumulative return on published calls
            </p>
            <p
              className={cn(
                "mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-[2.75rem] sm:leading-none",
                lastAccent === "up"
                  ? "text-emerald-600"
                  : lastAccent === "down"
                    ? "text-rose-600"
                    : "text-[var(--pf-black)]"
              )}
            >
              {last != null ? formatPct(last) : "—"}
            </p>
          </div>
          <div className="pf-track-record-stats flex w-full gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:w-auto sm:max-w-[28rem] sm:grid-cols-5 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            <HeroStat label="Calls" value={String(points.length)} />
            <HeroStat label="Wins" value={String(wins)} accent="up" />
            <HeroStat label="Losses" value={String(losses)} accent={losses > 0 ? "down" : "neutral"} />
            {winRate != null ? (
              <HeroStat label="Win rate" value={`${winRate}%`} />
            ) : null}
            {rankScore != null ? (
              <HeroStat label="Rank" value={rankScore.toFixed(1)} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-3 pb-2 pt-4 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <ChartRangeToolbar value={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--pf-gray-500)]">
            {drawdown ? (
              <span title="Peak-to-trough on cumulative return">
                Max drawdown{" "}
                <span className="font-semibold tabular-nums text-rose-600">
                  −{drawdown.pct.toFixed(1)}%
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0 w-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-emerald-600" />
              Win
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0 w-0 border-x-[4px] border-t-[6px] border-x-transparent border-t-rose-500" />
              Loss
            </span>
          </div>
        </div>
        {filtered.length > 0 ? (
          <ReturnLineChart
            points={filtered}
            height={300}
            interactive
            showMarkers
            filled
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
            No data in this range.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/50 px-5 py-3 sm:px-6">
        <p className="text-xs text-[var(--pf-gray-500)]">
          Marked to market on each refresh · click a marker to open the ticker
        </p>
        <Link
          href={profileHref}
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Full profile & history →
        </Link>
      </div>
    </section>
  );
}
