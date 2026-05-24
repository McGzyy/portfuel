import type { RankingsSummary } from "@/lib/calls/rankings-summary";

export function RankingsSummaryBar({ summary }: { summary: RankingsSummary }) {
  if (summary.rankedCount === 0) return null;

  const items = [
    { label: "Ranked members", value: String(summary.rankedCount) },
    { label: "Trusted", value: String(summary.trustedCount) },
    { label: "Total calls", value: String(summary.totalCalls) },
    {
      label: "Avg win rate",
      value:
        summary.avgWinRate != null ? `${summary.avgWinRate.toFixed(0)}%` : "—",
    },
    {
      label: "Top score",
      value: summary.topScore != null ? summary.topScore.toFixed(1) : "—",
    },
  ];

  return (
    <section
      className="mb-8 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white/90 p-4 shadow-[var(--pf-shadow-sm)]"
      aria-label="Leaderboard summary"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Leaderboard pulse
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
              {item.label}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--pf-black)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
