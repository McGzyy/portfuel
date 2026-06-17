import Link from "next/link";
import type { ReactNode } from "react";
import { Calendar, Coins, ScanSearch, TrendingUp } from "lucide-react";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { formatPct, cn } from "@/lib/utils";
import {
  buildProOverviewGateDescription,
  formatSymbolSample,
  watchlistReportingSymbols,
} from "@/lib/pro/upgrade-prompt";

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
  locked = false,
  proGateCta = "upgrade",
  watchlistSymbols = [],
  reportingSymbols = [],
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
  locked?: boolean;
  proGateCta?: ProGateCta;
  watchlistSymbols?: string[];
  /** Symbols reporting in the earnings battleboard window (for watchlist overlap). */
  reportingSymbols?: string[];
}) {
  const strip = (
    <ResearchPulseCards battleboard={battleboard} screener={screener} interactive={!locked} />
  );

  if (!locked) return strip;

  return (
    <ProIntelligenceGate
      locked
      cta={proGateCta}
      variant="preview"
      title="Unlock research pulse"
      description={buildProOverviewGateDescription(watchlistSymbols)}
      teaser={
        <ResearchPulseTeaser
          battleboard={battleboard}
          screener={screener}
          watchlistSymbols={watchlistSymbols}
          reportingSymbols={reportingSymbols}
        />
      }
      className="rounded-[var(--pf-radius-lg)]"
    >
      {strip}
    </ProIntelligenceGate>
  );
}

function ResearchPulseTeaser({
  battleboard,
  screener,
  watchlistSymbols,
  reportingSymbols,
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
  watchlistSymbols: string[];
  reportingSymbols: string[];
}) {
  const pills: string[] = [];
  const watchlistSample = formatSymbolSample(watchlistSymbols, 4);
  if (watchlistSample) {
    pills.push(`Watchlist · ${watchlistSample}`);
  }
  const reportingOverlap = watchlistReportingSymbols(watchlistSymbols, reportingSymbols);
  if (reportingOverlap.length > 0) {
    pills.push(`${reportingOverlap.length} watchlist name${reportingOverlap.length === 1 ? "" : "s"} reporting soon`);
  }
  if (battleboard.reportingCount > 0) {
    pills.push(`${battleboard.reportingCount} reporting this week`);
  }
  if (screener.mostCalled.length > 0) {
    pills.push(`${screener.mostCalled.length} active symbol${screener.mostCalled.length === 1 ? "" : "s"}`);
  }
  if (screener.topReturns.length > 0) {
    pills.push(`${screener.topReturns.length} ranked return${screener.topReturns.length === 1 ? "" : "s"}`);
  }
  const topCrypto = screener.topReturns.find((r) => r.asset_class === "crypto");
  if (topCrypto) {
    pills.push(`${topCrypto.symbol} leading crypto`);
  }

  if (pills.length === 0) {
    return (
      <p className="text-sm text-[var(--pf-gray-600)]">
        Pro adds a live research pulse — earnings, screener, and crypto movers on your overview.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="inline-block rounded-full bg-[var(--pf-red-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
        Pro preview
      </span>
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <span
            key={p}
            className="pf-chip-action text-xs font-medium"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ResearchPulseCards({
  battleboard,
  screener,
  interactive,
  embedded = false,
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
  interactive: boolean;
  /** Omit outer panel chrome when nested in ProCommandCenter. */
  embedded?: boolean;
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

  const grid = (
    <div className={embedded ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" : "mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"}>
        <PulseLink
          href={buildResearchHubHref("earnings")}
          icon={Calendar}
          iconClass={embedded ? "text-sky-300" : "text-[var(--pf-red)]"}
          title="Earnings"
          detail={earningsLine}
          interactive={interactive}
          embedded={embedded}
        />
        <PulseLink
          href={buildResearchHubHref("screener")}
          icon={ScanSearch}
          iconClass={embedded ? "text-sky-300" : "text-[var(--pf-red)]"}
          title="Screener"
          detail={
            <>
              {screenerLine}
              {topProgress?.return_pct != null ? (
                <span className="pf-return-up ml-1 font-semibold">
                  · {formatPct(topProgress.return_pct)}
                </span>
              ) : null}
            </>
          }
          interactive={interactive}
          embedded={embedded}
        />
        {topReturn ? (
          <PulseLink
            href={`/ticker/${topReturn.symbol}`}
            icon={TrendingUp}
            iconClass="pf-return-up"
            title="Best 30d return"
            detail={`${topReturn.symbol} ${formatPct(topReturn.return_pct)} · @${topReturn.username}`}
            interactive={interactive}
            embedded={embedded}
          />
        ) : (
          <PulseLink
            href={buildResearchHubHref("screener")}
            icon={TrendingUp}
            iconClass={embedded ? "text-slate-400" : "text-[var(--pf-gray-400)]"}
            title="Best 30d return"
            detail="No ranked returns yet this month"
            interactive={interactive}
            embedded={embedded}
          />
        )}
        <PulseLink
          href={topCrypto ? `/ticker/${topCrypto.symbol}` : buildResearchHubHref("screener")}
          icon={Coins}
          iconClass={embedded ? "text-indigo-300" : "text-indigo-600"}
          title="Crypto movers"
          detail={cryptoLine}
          interactive={interactive}
          embedded={embedded}
        />
      </div>
  );

  if (embedded) return grid;

  return (
    <section className="pf-workspace-panel px-4 py-3 sm:px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Pro Intelligence · Research pulse
      </p>
      {grid}
    </section>
  );
}

function PulseLink({
  href,
  icon: Icon,
  iconClass,
  title,
  detail,
  interactive = true,
  embedded = false,
}: {
  href: string;
  icon: typeof Calendar;
  iconClass: string;
  title: string;
  detail: ReactNode;
  interactive?: boolean;
  embedded?: boolean;
}) {
  const className = cn(
    "pf-pulse-card",
    embedded && "border-white/10 bg-white/5 hover:bg-white/10"
  );

  const inner = (
    <>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2.25} />
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm font-bold",
            embedded ? "text-white" : "text-[var(--pf-black)]"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-xs leading-relaxed",
            embedded ? "text-slate-200" : "text-[var(--pf-gray-600)]"
          )}
        >
          {detail}
        </span>
      </span>
    </>
  );

  if (!interactive) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
