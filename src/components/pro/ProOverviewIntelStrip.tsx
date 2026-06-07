import Link from "next/link";
import type { ReactNode } from "react";
import { Calendar, Coins, ScanSearch, TrendingUp } from "lucide-react";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
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
  locked = false,
  proGateCta = "upgrade",
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
  locked?: boolean;
  proGateCta?: ProGateCta;
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
      description="Live earnings positioning, screener movers, and crypto leaders on your overview — included with Pro Intelligence."
      teaser={<ResearchPulseTeaser battleboard={battleboard} screener={screener} />}
      className="rounded-[var(--pf-radius-lg)]"
    >
      {strip}
    </ProIntelligenceGate>
  );
}

function ResearchPulseTeaser({
  battleboard,
  screener,
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
}) {
  const pills: string[] = [];
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
            className="rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--pf-gray-700)]"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResearchPulseCards({
  battleboard,
  screener,
  interactive,
}: {
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
  interactive: boolean;
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
          interactive={interactive}
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
          interactive={interactive}
        />
        {topReturn ? (
          <PulseLink
            href={`/ticker/${topReturn.symbol}`}
            icon={TrendingUp}
            iconClass="text-emerald-600"
            title="Best 30d return"
            detail={`${topReturn.symbol} ${formatPct(topReturn.return_pct)} · @${topReturn.username}`}
            interactive={interactive}
          />
        ) : (
          <PulseLink
            href={buildResearchHubHref("screener")}
            icon={TrendingUp}
            iconClass="text-[var(--pf-gray-400)]"
            title="Best 30d return"
            detail="No ranked returns yet this month"
            interactive={interactive}
          />
        )}
        <PulseLink
          href={topCrypto ? `/ticker/${topCrypto.symbol}` : buildResearchHubHref("screener")}
          icon={Coins}
          iconClass="text-indigo-600"
          title="Crypto movers"
          detail={cryptoLine}
          interactive={interactive}
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
  interactive = true,
}: {
  href: string;
  icon: typeof Calendar;
  iconClass: string;
  title: string;
  detail: ReactNode;
  interactive?: boolean;
}) {
  const className =
    "flex min-w-0 items-start gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white";

  const inner = (
    <>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2.25} />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--pf-black)]">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
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
