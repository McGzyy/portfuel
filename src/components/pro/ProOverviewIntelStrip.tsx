import Link from "next/link";
import type { ReactNode } from "react";
import { Calendar, Coins, ScanSearch, TrendingUp } from "lucide-react";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { formatPct } from "@/lib/utils";

function fmtShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Pro overview: quick links to earnings, screener, and movers without leaving home. */
export function ProOverviewIntelStrip({
  battleboard,
  screener,
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
}) {
  const topCalled = screener.mostCalled[0];
  const topProgress = screener.targetProgress[0];
  const topReturn = screener.topReturns[0];
  const topCrypto = screener.topReturns.find((r) => r.asset_class === "crypto");

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
        : "Earnings calendar";

  const cryptoLine = topCrypto
    ? `${topCrypto.symbol} ${formatPct(topCrypto.return_pct)} · @${topCrypto.username}`
    : "No crypto movers in the top 30d window";

  return (
    <section className="pf-workspace-panel px-4 py-3 sm:px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Pro Intelligence · Research pulse
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PulseLink
          href={buildResearchHubHref("earnings")}
          icon={Calendar}
          iconClass="text-[var(--pf-red)]"
          title="Earnings"
          detail={earningsLine}
        />
        <PulseLink
          href={buildResearchHubHref("screener")}
          icon={ScanSearch}
          iconClass="text-[var(--pf-red)]"
          title="Screener"
          detail={
            <>
              {screenerLine}
              {topProgress?.return_pct != null ? (
                <span className="ml-1 font-semibold text-emerald-700">
                  · {formatPct(topProgress.return_pct)}
                </span>
              ) : null}
            </>
          }
        />
        {topReturn ? (
          <PulseLink
            href={`/ticker/${topReturn.symbol}`}
            icon={TrendingUp}
            iconClass="text-emerald-600"
            title="Best 30d return"
            detail={`${topReturn.symbol} ${formatPct(topReturn.return_pct)} · @${topReturn.username}`}
          />
        ) : (
          <PulseLink
            href={buildResearchHubHref("screener")}
            icon={TrendingUp}
            iconClass="text-[var(--pf-gray-400)]"
            title="Best 30d return"
            detail="No ranked returns yet this month"
          />
        )}
        <PulseLink
          href={topCrypto ? `/ticker/${topCrypto.symbol}` : buildResearchHubHref("screener")}
          icon={Coins}
          iconClass="text-indigo-600"
          title="Crypto movers"
          detail={cryptoLine}
        />
      </div>
    </section>
  );
}

function PulseLink({
  href,
  icon: Icon,
  iconClass,
  title,
  detail,
}: {
  href: string;
  icon: typeof Calendar;
  iconClass: string;
  title: string;
  detail: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 items-start gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2.25} />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--pf-black)]">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
          {detail}
        </span>
      </span>
    </Link>
  );
}
