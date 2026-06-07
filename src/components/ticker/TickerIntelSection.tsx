import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { TickerIntelPanel } from "@/components/ticker/TickerIntelPanel";
import { TickerIntelTeaser } from "@/components/ticker/TickerIntelTeaser";
import { formatProIntelligenceLabel } from "@/lib/marketing/plans";
import type { TickerIntel } from "@/lib/market/ticker-intel";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { IntelTeaserSummary } from "@/lib/market/intel-teaser";

export function TickerIntelSection({
  intel,
  locked,
  proGateCta,
  teaser,
}: {
  intel: TickerIntel;
  locked: boolean;
  proGateCta: ProGateCta;
  teaser: IntelTeaserSummary;
}) {
  const isEquity = intel.assetClass === "equity";

  return (
    <section id="intel" className="scroll-mt-24">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Pro Intelligence
        </p>
        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--pf-black)]">
          {isEquity ? "News, earnings & filings" : "Headlines & venue"}
        </h2>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          {isEquity
            ? locked
              ? "Preview below — upgrade to read full headlines and SEC forms on every equity ticker."
              : "Headlines, earnings history, and SEC filings for this symbol. Watchlist = your dates; Earnings = market-wide positioning."
            : locked
              ? "Preview below — upgrade to read symbol-filtered crypto headlines and venue context."
              : "Exchange venue, daily change, and crypto headlines tagged to this symbol."}
        </p>
      </div>

      <ProIntelligenceGate
        locked={locked}
        cta={proGateCta}
        variant="preview"
        title={isEquity ? "Unlock full market intel" : "Unlock crypto headlines"}
        description={
          isEquity
            ? `Read headlines, earnings, and SEC filings on every equity ticker — included with ${formatProIntelligenceLabel()}.`
            : `Read venue context and symbol-filtered crypto headlines on listed pairs — included with ${formatProIntelligenceLabel()}.`
        }
        teaser={
          locked ? (
            <TickerIntelTeaser summary={teaser} assetClass={intel.assetClass} />
          ) : undefined
        }
      >
        <div className="pf-workspace-panel p-4 sm:p-5">
          <TickerIntelPanel intel={intel} />
        </div>
      </ProIntelligenceGate>
    </section>
  );
}
