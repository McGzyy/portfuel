import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { formatPct } from "@/lib/utils";
import type { FeedSummary } from "@/lib/calls/feed-summary";

export function OverviewCommunityPulse({
  summary,
  proLocked,
  proGateCta,
}: {
  summary: FeedSummary;
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
        eyebrow="Community pulse · 30 days"
        items={[
          {
            label: "Active calls",
            value: String(summary.count),
            hint: "Member + desk",
          },
          {
            label: "Avg return",
            value: formatPct(avg),
            hint: "Marked-to-market",
            accent: avgAccent,
          },
          {
            label: "Winners",
            value: String(summary.winners),
            hint: `${summary.losers} red`,
          },
        ]}
      />

      <ProIntelligenceGate
        locked={proLocked}
        cta={proGateCta}
        title="Pro community analytics"
        description="Desk thesis counts and position mix analytics — Pro Intelligence ($129/mo)."
        compact
      >
        <MetricsStrip
          eyebrow="Pro analytics"
          items={[
            {
              label: "Desk theses",
              value: String(summary.fueledCount),
              hint: "Fueled badge",
            },
            {
              label: "Long / short",
              value: `${summary.longCount} / ${summary.shortCount}`,
              hint: "Position mix",
            },
          ]}
        />
      </ProIntelligenceGate>
    </div>
  );
}
