import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { RankingsSummary } from "@/lib/calls/rankings-summary";

export function RankingsSummaryBar({
  summary,
  proLocked,
  proGateCta,
}: {
  summary: RankingsSummary;
  proLocked: boolean;
  proGateCta: ProGateCta;
}) {
  if (summary.rankedCount === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      <ChartFrame title="Leaderboard pulse" subtitle="Community rank activity at a glance">
        <MetricsStrip
          variant="embedded"
          items={[
            { label: "Ranked members", value: String(summary.rankedCount) },
            { label: "Trusted", value: String(summary.trustedCount) },
            { label: "Total calls", value: String(summary.totalCalls) },
          ]}
        />
      </ChartFrame>

      <ProIntelligenceGate
        locked={proLocked}
        cta={proGateCta}
        title="Pro leaderboard depth"
        description="Win-rate aggregates and top score breakdowns — Pro Intelligence ($129/mo)."
        compact
      >
        <ChartFrame title="Pro rankings" subtitle="Aggregate performance across ranked members">
          <MetricsStrip
            variant="embedded"
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
        </ChartFrame>
      </ProIntelligenceGate>
    </div>
  );
}
