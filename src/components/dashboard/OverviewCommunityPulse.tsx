import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { formatPct } from "@/lib/utils";
import type { FeedSummary } from "@/lib/calls/feed-summary";

export function OverviewCommunityPulse({
  summary,
  proLocked,
}: {
  summary: FeedSummary;
  proLocked: boolean;
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
        title="Pro community analytics"
        description="Desk thesis counts and position mix analytics — included with membership."
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
