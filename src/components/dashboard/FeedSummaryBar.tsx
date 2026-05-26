import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { formatPct } from "@/lib/utils";
import type { FeedSummary } from "@/lib/calls/feed-summary";
import type { FeedTab } from "@/lib/dashboard/nav";

export function FeedSummaryBar({
  summary,
  mode,
  proLocked,
  proGateCta,
}: {
  summary: FeedSummary;
  mode: FeedTab;
  proLocked: boolean;
  proGateCta: ProGateCta;
}) {
  if (summary.count === 0) return null;

  const avg = summary.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="space-y-4">
      <MetricsStrip
        eyebrow="Feed intelligence"
        items={[
          {
            label: "Avg return",
            value: formatPct(avg),
            hint: mode === "performing" ? "30-day movers" : "This view",
            accent: avgAccent,
          },
          {
            label: "Winners",
            value: String(summary.winners),
            hint: "Positive P&L",
          },
          {
            label: "Long / short",
            value: `${summary.longCount} / ${summary.shortCount}`,
            hint: "Position mix",
          },
        ]}
      />

      <ProIntelligenceGate
        locked={proLocked}
        cta={proGateCta}
        title="Pro feed analytics"
        description="Target progress, desk thesis counts, and deeper performance slices — Pro Intelligence ($129/mo)."
        compact
      >
        <MetricsStrip
          eyebrow="Pro analytics"
          items={[
            {
              label: "Fueled",
              value: String(summary.fueledCount),
              hint: "Desk theses in view",
            },
            {
              label: "To target",
              value:
                summary.avgTargetProgress != null
                  ? `${summary.avgTargetProgress.toFixed(0)}%`
                  : "—",
              hint: "Avg progress",
            },
            {
              label: "Losers",
              value: String(summary.losers),
              hint: "Negative P&L",
            },
          ]}
        />
      </ProIntelligenceGate>
    </div>
  );
}
