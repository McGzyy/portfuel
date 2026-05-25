import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { RankingsSummary } from "@/lib/calls/rankings-summary";

export function RankingsSummaryBar({
  summary,
  proLocked,
}: {
  summary: RankingsSummary;
  proLocked: boolean;
}) {
  if (summary.rankedCount === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      <MetricsStrip
        eyebrow="Leaderboard pulse"
        items={[
          { label: "Ranked members", value: String(summary.rankedCount) },
          { label: "Trusted", value: String(summary.trustedCount) },
          { label: "Total calls", value: String(summary.totalCalls) },
        ]}
      />

      <ProIntelligenceGate
        locked={proLocked}
        title="Pro leaderboard depth"
        description="Win-rate aggregates and top score breakdowns — available to active members."
        compact
      >
        <MetricsStrip
          eyebrow="Pro rankings"
          items={[
            {
              label: "Avg win rate",
              value:
                summary.avgWinRate != null ? `${summary.avgWinRate.toFixed(0)}%` : "—",
              hint: "Across ranked",
            },
            {
              label: "Top score",
              value: summary.topScore != null ? summary.topScore.toFixed(1) : "—",
              hint: "#1 member",
            },
          ]}
        />
      </ProIntelligenceGate>
    </div>
  );
}
