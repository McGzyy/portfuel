import { EarningsBattleboardLegend } from "@/components/pro/EarningsBattleboardLegend";
import { EarningsBattleboardTable } from "@/components/pro/EarningsBattleboardTable";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { EarningsBattleboardRow } from "@/lib/earnings/battleboard";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import {
  buildEarningsGateDescription,
  formatSymbolSample,
  watchlistReportingSymbols,
} from "@/lib/pro/upgrade-prompt";

export function ProEarningsBattleboardSection({
  rows,
  locked,
  proGateCta,
  watchlistSymbols = [],
}: {
  rows: EarningsBattleboardRow[];
  locked: boolean;
  proGateCta: ProGateCta;
  watchlistSymbols?: string[];
}) {
  const reportingSymbols = rows.map((row) => row.symbol);
  const overlap = watchlistReportingSymbols(watchlistSymbols, reportingSymbols);

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      variant={locked ? "preview" : "default"}
      title="Earnings battleboard"
      description={buildEarningsGateDescription(watchlistSymbols, reportingSymbols)}
      teaser={
        locked && overlap.length > 0 ? (
          <EarningsPreviewTeaser symbols={overlap} />
        ) : undefined
      }
    >
      <div className="space-y-4">
        <EarningsBattleboardLegend />
        <EarningsBattleboardTable rows={rows} />
      </div>
    </ProIntelligenceGate>
  );
}

function EarningsPreviewTeaser({ symbols }: { symbols: string[] }) {
  const sample = formatSymbolSample(symbols, 4);
  if (!sample) return null;

  return (
    <div className="space-y-2">
      <span className="inline-block rounded-full bg-[var(--pf-red-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
        Pro preview
      </span>
      <p className="text-sm text-[var(--pf-gray-700)]">
        Reporting soon on your watchlist:{" "}
        <span className="font-mono font-semibold text-[var(--pf-black)]">{sample}</span>
      </p>
    </div>
  );
}
