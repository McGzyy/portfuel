import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { formatPct } from "@/lib/utils";
import type { FeedSummary } from "@/lib/calls/feed-summary";

export function OverviewCommunityPulse({ summary }: { summary: FeedSummary }) {
  if (summary.count === 0) return null;

  const avg = summary.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);

  return (
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
  );
}
