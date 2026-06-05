import Link from "next/link";
import { Calendar, ScanSearch, TrendingUp } from "lucide-react";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { formatPct } from "@/lib/utils";

function fmtShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Pro overview: surface earnings battleboard + screener movers without leaving home. */
export function ProOverviewIntelStrip({
  battleboard,
  screener,
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
}) {
  const topCalled = screener.mostCalled[0];
  const topProgress = screener.targetProgress[0];
  const screenerLine = topProgress
    ? `${topProgress.symbol} ${Math.round(topProgress.target_progress)}% to target`
    : topCalled
      ? `${topCalled.symbol} · ${topCalled.callCount} call${topCalled.callCount === 1 ? "" : "s"} this week`
      : "Community screener";

  const earningsLine =
    battleboard.withCommunity > 0 && battleboard.nextSymbol && battleboard.nextDate
      ? `${battleboard.withCommunity} reporting name${battleboard.withCommunity === 1 ? "" : "s"} with calls · next ${battleboard.nextSymbol} ${fmtShortDate(battleboard.nextDate)}`
      : battleboard.reportingCount > 0
        ? `${battleboard.reportingCount} symbols reporting — open Earnings for positioning`
        : "Earnings";

  return (
    <section className="pf-workspace-panel px-4 py-3 sm:px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Pro Intelligence · Today
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
        <Link
          href="/dashboard/earnings"
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white"
        >
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.25} />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-[var(--pf-black)]">Earnings</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
              {earningsLine}
            </span>
          </span>
        </Link>
        <Link
          href="/dashboard/screener"
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white"
        >
          <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.25} />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-[var(--pf-black)]">Screener pulse</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
              {screenerLine}
              {topProgress?.return_pct != null ? (
                <span className="ml-1 font-semibold text-emerald-700">
                  · {formatPct(topProgress.return_pct)}
                </span>
              ) : null}
            </span>
          </span>
        </Link>
        {screener.topReturns[0] ? (
          <Link
            href={`/ticker/${screener.topReturns[0].symbol}`}
            className="hidden min-w-0 flex-1 items-start gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white lg:flex"
          >
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.25} />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[var(--pf-black)]">Best 30d return</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
                ${screener.topReturns[0].symbol} {formatPct(screener.topReturns[0].return_pct)} · @
                {screener.topReturns[0].username}
              </span>
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
