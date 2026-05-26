import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { ScreenerChartPanels } from "@/components/pro/ScreenerChartPanels";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { CommunityScreenerData } from "@/lib/screener/community";

export function ProCommunityScreener({
  data,
  locked,
  proGateCta,
  showExport,
}: {
  data: CommunityScreenerData;
  locked: boolean;
  proGateCta: ProGateCta;
  showExport?: boolean;
}) {
  const body = <ScreenerChartPanels data={data} />;

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
        title="Community screener"
        description="See what the desk is calling most and which theses are winning — Pro Intelligence."
      >
        {body}
      </ProIntelligenceGate>
    </div>
  );
}
