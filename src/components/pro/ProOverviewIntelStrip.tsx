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

function earningsPulseLines(battleboard: EarningsBattleboardSummary): {
  detail: string;
  meta?: string;
} {
  if (battleboard.withCommunity > 0 && battleboard.nextSymbol && battleboard.nextDate) {
    return {
      detail: `${battleboard.reportingCount} symbols in the 14-day window`,
      meta: `Next ${battleboard.nextSymbol} ${fmtShortDate(battleboard.nextDate)} · ${battleboard.withCommunity} with community calls`,
    };
  }
  if (battleboard.reportingCount > 0) {
    return {
      detail: `${battleboard.reportingCount} symbols reporting`,
      meta:
        battleboard.nextSymbol && battleboard.nextDate
          ? `Next up ${battleboard.nextSymbol} ${fmtShortDate(battleboard.nextDate)}`
          : "Open earnings for dates and community skew",
    };
  }
  return { detail: "Earnings calendar", meta: "No reports in the current window" };
}

function screenerPulseLines(
  screener: CommunityScreenerData
): { detail: React.ReactNode; meta?: string } {
  const topProgress = screener.targetProgress[0];
  const topCalled = screener.mostCalled[0];

  if (topProgress) {
    return {
      detail: (
        <>
          {topProgress.symbol} {Math.round(topProgress.target_progress)}% to target
          {topProgress.return_pct != null ? (
            <span className="pf-return-up pf-return-up--on-dark ml-1 font-semibold">
              · {formatPct(topProgress.return_pct)}
            </span>
          ) : null}
        </>
      ),
      meta:
        screener.targetProgress.length > 1
          ? `Also: ${screener.targetProgress
              .slice(1, 3)
              .map((r) => `${r.symbol} ${Math.round(r.target_progress)}%`)
              .join(" · ")}`
          : `${topProgress.direction.toUpperCase()} · @${topProgress.username}`,
    };
  }

  if (topCalled) {
    return {
      detail: `${topCalled.symbol} · ${topCalled.callCount} call${topCalled.callCount === 1 ? "" : "s"} this week`,
      meta: `${topCalled.latestDirection.toUpperCase()} bias · best ${
        topCalled.bestReturnPct != null ? formatPct(topCalled.bestReturnPct) : "—"
      }`,
    };
  }

  return { detail: "Community screener", meta: "No target progress in this window" };
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
  const topReturn = screener.topReturns[0];
  const topCrypto = screener.topReturns.find((r) => r.asset_class === "crypto");

  const earnings = earningsPulseLines(battleboard);
  const screenerCopy = screenerPulseLines(screener);

  const grid = (
    <div className={embedded ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" : "mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"}>
        <PulseLink
          href={buildResearchHubHref("earnings")}
          icon={Calendar}
          iconClass={embedded ? "text-sky-300" : "text-[var(--pf-red)]"}
          title="Earnings"
          detail={earnings.detail}
          meta={earnings.meta}
          interactive={interactive}
          embedded={embedded}
        />
        <PulseLink
          href={buildResearchHubHref("screener")}
          icon={ScanSearch}
          iconClass={embedded ? "text-sky-300" : "text-[var(--pf-red)]"}
          title="Screener"
          detail={screenerCopy.detail}
          meta={screenerCopy.meta}
          interactive={interactive}
          embedded={embedded}
        />
        {topReturn ? (
          <PulseLink
            href={`/ticker/${topReturn.symbol}`}
            icon={TrendingUp}
            iconClass="pf-return-up pf-return-up--on-dark"
            title="Best 30d return"
            detail={`${topReturn.symbol} ${formatPct(topReturn.return_pct)}`}
            meta={`${topReturn.direction.toUpperCase()} · @${topReturn.username} · 30d ranked`}
            interactive={interactive}
            embedded={embedded}
          />
        ) : (
          <PulseLink
            href={buildResearchHubHref("screener")}
            icon={TrendingUp}
            iconClass={embedded ? "text-slate-400" : "text-[var(--pf-gray-400)]"}
            title="Best 30d return"
            detail="No ranked returns yet"
            meta="Community returns populate as calls close"
            interactive={interactive}
            embedded={embedded}
          />
        )}
        <PulseLink
          href={topCrypto ? `/ticker/${topCrypto.symbol}` : buildResearchHubHref("screener")}
          icon={Coins}
          iconClass={embedded ? "text-indigo-300" : "text-indigo-600"}
          title="Crypto movers"
          detail={
            topCrypto
              ? `${topCrypto.symbol} ${formatPct(topCrypto.return_pct)}`
              : "No crypto movers in the top 30d window"
          }
          meta={
            topCrypto
              ? `${topCrypto.direction.toUpperCase()} · @${topCrypto.username} · majors vs BTC`
              : "Ranked crypto returns in the screener"
          }
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
  meta,
  interactive = true,
  embedded = false,
}: {
  href: string;
  icon: typeof Calendar;
  iconClass: string;
  title: string;
  detail: ReactNode;
  meta?: string;
  interactive?: boolean;
  embedded?: boolean;
}) {
  const className = cn(
    "pf-pulse-card",
    embedded && "pf-pulse-card--embedded"
  );

  const inner = (
    <>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} strokeWidth={2.25} />
      <span className="min-w-0">
        <span
          className={cn(
            "pf-pulse-card-title block text-sm font-bold",
            embedded ? "text-white" : "text-[var(--pf-black)]"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "pf-pulse-card-detail mt-0.5 block text-xs leading-relaxed",
            embedded ? "text-slate-300" : "text-[var(--pf-gray-600)]"
          )}
        >
          {detail}
        </span>
        {meta ? (
          <span
            className={cn(
              "pf-pulse-card-meta mt-1 block text-[11px] leading-snug",
              embedded ? "text-slate-500" : "text-[var(--pf-gray-500)]"
            )}
          >
            {meta}
          </span>
        ) : null}
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
