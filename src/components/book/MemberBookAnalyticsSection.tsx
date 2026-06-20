"use client";

import Link from "next/link";
import { CompareMultiLineChart } from "@/components/charts/CompareMultiLineChart";
import { ReturnLineChart } from "@/components/charts/ReturnLineChart";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { BookExposurePanel } from "@/components/book/BookExposurePanel";
import type { BookAnalyticsSnapshot } from "@/lib/charts/book-analytics";
import type { ReturnChartPoint, ChartMemberAvatar } from "@/lib/charts/types";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { COPY } from "@/lib/copy";
import { cn, formatPct } from "@/lib/utils";

function StatChip({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "positive" | "negative" | "neutral";
}) {
  const valueClass =
    accent === "positive"
      ? "pf-return-up"
      : accent === "negative"
        ? "pf-return-down"
        : "text-[var(--pf-black)]";

  return (
    <div className="rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p className={cn("mt-0.5 text-lg font-bold tabular-nums", valueClass)}>{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-[var(--pf-gray-500)]">{hint}</p> : null}
    </div>
  );
}

export function MemberBookAnalyticsSection({
  analytics,
  performancePoints,
  memberAvatar,
  profileHref,
  username,
  proLocked,
  proGateCta,
}: {
  analytics: BookAnalyticsSnapshot;
  performancePoints: ReturnChartPoint[];
  memberAvatar?: ChartMemberAvatar | null;
  profileHref: string;
  username: string;
  proLocked: boolean;
  proGateCta: ProGateCta;
}) {
  const hasPerformance = performancePoints.length >= 2;
  const hasBenchmark = analytics.benchmarkPoints.length >= 2;
  const rel = analytics.relativeReturnPct;
  const relAccent =
    rel == null ? undefined : rel >= 0 ? ("positive" as const) : ("negative" as const);

  const compareSeries = hasBenchmark
    ? [
        { symbol: "Your book", points: analytics.performancePoints },
        { symbol: analytics.benchmarkSymbol, points: analytics.benchmarkPoints },
      ]
    : [];

  const proChartBody = (
    <div className="space-y-4 p-2 sm:p-3">
      {hasPerformance && hasBenchmark ? (
        <CompareMultiLineChart series={compareSeries} height={180} />
      ) : hasPerformance ? (
        <ReturnLineChart
          points={performancePoints}
          height={180}
          compact
          interactive
          showMarkers
          showAvatars
          memberAvatar={memberAvatar}
        />
      ) : null}

      {analytics.drawdownPoints.length >= 2 ? (
        <div className="rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[var(--pf-gray-700)]">Drawdown from peak</p>
            {analytics.maxDrawdownPct != null ? (
              <p className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">
                Max −{analytics.maxDrawdownPct.toFixed(1)}%
              </p>
            ) : null}
          </div>
          <CompareMultiLineChart
            series={[{ symbol: "Underwater", points: analytics.drawdownPoints }]}
            height={88}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatChip
          label="Book return"
          value={
            analytics.portfolioReturnPct != null ? formatPct(analytics.portfolioReturnPct) : "—"
          }
          hint="Cumulative on published calls"
          accent={
            analytics.portfolioReturnPct != null && analytics.portfolioReturnPct >= 0
              ? "positive"
              : analytics.portfolioReturnPct != null
                ? "negative"
                : undefined
          }
        />
        <StatChip
          label={`vs ${analytics.benchmarkSymbol}`}
          value={rel != null ? formatPct(rel) : "—"}
          hint={
            analytics.benchmarkReturnPct != null
              ? `${analytics.benchmarkSymbol} ${formatPct(analytics.benchmarkReturnPct)} same window`
              : undefined
          }
          accent={relAccent}
        />
        <StatChip
          label="Max drawdown"
          value={
            analytics.maxDrawdownPct != null ? `−${analytics.maxDrawdownPct.toFixed(1)}%` : "—"
          }
          hint="Worst peak-to-trough on book curve"
          accent="negative"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {analytics.exposure ? <BookExposurePanel exposure={analytics.exposure} /> : null}

      {hasPerformance ? (
        <section className="pf-workspace-panel overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pf-border)] px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
                {!proLocked ? "Pro · book analytics" : "Book analytics"}
              </p>
              <h2 className="mt-1 text-sm font-bold tracking-tight text-[var(--pf-black)]">
                Performance vs benchmark
              </h2>
              <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
                Mark-to-market cumulative return on your published calls vs{" "}
                {analytics.benchmarkSymbol} over the same window
              </p>
            </div>
            {analytics.portfolioReturnPct != null ? (
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  analytics.portfolioReturnPct >= 0 ? "pf-return-up" : "pf-return-down"
                )}
              >
                {formatPct(analytics.portfolioReturnPct)}
              </p>
            ) : null}
          </div>

          {proLocked ? (
            <ProIntelligenceGate
              locked
              cta={proGateCta}
              title="Benchmark & drawdown"
              description="Compare your book to SPY or BTC, see underwater drawdown, and relative alpha on Pro."
              compact
              teaser={
                <p className="text-sm text-[var(--pf-gray-600)]">
                  {rel != null
                    ? `${formatPct(rel)} vs ${analytics.benchmarkSymbol} · max DD −${analytics.maxDrawdownPct?.toFixed(1) ?? "—"}%`
                    : `Benchmark overlay and drawdown chart on Pro`}
                </p>
              }
            >
              {proChartBody}
            </ProIntelligenceGate>
          ) : (
            proChartBody
          )}

          <div className="border-t border-[var(--pf-border)] px-5 py-3 text-center">
            <Link
              href={profileHref}
              className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              @{username} public track record →
            </Link>
          </div>
        </section>
      ) : (
        <section className="pf-workspace-panel px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--pf-black)]">No performance history yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--pf-gray-500)]">
            Publish calls with entry prices to build a benchmarked book curve.
          </p>
          <Link href={COPY.newCallHref} className="mt-4 inline-block text-sm font-semibold text-[var(--pf-red)] hover:underline">
            {COPY.publishCallCta} →
          </Link>
        </section>
      )}
    </div>
  );
}
