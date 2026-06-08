import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { ScreenerChartPanels } from "@/components/pro/ScreenerChartPanels";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { CommunityScreenerData } from "@/lib/screener/community";
import {
  buildScreenerGateDescription,
  formatSymbolSample,
  watchlistScreenerHits,
} from "@/lib/pro/upgrade-prompt";

export function ProCommunityScreener({
  data,
  locked,
  proGateCta,
  showExport,
  watchlistSymbols = [],
}: {
  data: CommunityScreenerData;
  locked: boolean;
  proGateCta: ProGateCta;
  showExport?: boolean;
  watchlistSymbols?: string[];
}) {
  const body = <ScreenerChartPanels data={data} />;
  const screenerHits = watchlistScreenerHits(watchlistSymbols, [
    data.mostCalled,
    data.topReturns,
    data.targetProgress,
  ]);

  return (
    <div className="space-y-4">
      {showExport && !locked ? (
        <div className="flex justify-end">
          <a
            href="/api/pro/screener/export"
            className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Export CSV →
          </a>
        </div>
      ) : null}
      <ProIntelligenceGate
        locked={locked}
        cta={proGateCta}
        variant={locked ? "preview" : "default"}
        title="Community screener"
        description={buildScreenerGateDescription(watchlistSymbols, screenerHits)}
        teaser={
          locked && screenerHits.length > 0 ? (
            <ScreenerPreviewTeaser symbols={screenerHits} />
          ) : undefined
        }
      >
        {body}
      </ProIntelligenceGate>
    </div>
  );
}

function ScreenerPreviewTeaser({ symbols }: { symbols: string[] }) {
  const sample = formatSymbolSample(symbols, 4);
  if (!sample) return null;

  return (
    <div className="space-y-2">
      <span className="inline-block rounded-full bg-[var(--pf-red-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
        Pro preview
      </span>
      <p className="text-sm text-[var(--pf-gray-700)]">
        On your watchlist this week:{" "}
        <span className="font-mono font-semibold text-[var(--pf-black)]">{sample}</span>
      </p>
    </div>
  );
}
