import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { formatPct } from "@/lib/utils";
import type { TickerCommunityStats } from "@/lib/calls/ticker-community-stats";

export function TickerCommunityBar({ stats }: { stats: TickerCommunityStats }) {
  if (stats.callCount === 0) return null;

  const avg = stats.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);
  const best = stats.bestReturnPct;
  const bestAccent =
    best == null ? undefined : best >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <MetricsStrip
      eyebrow="Community on this ticker"
      items={[
        { label: "Member calls", value: String(stats.callCount) },
        { label: "Long / short", value: `${stats.longCount} / ${stats.shortCount}` },
        { label: "Fueled", value: String(stats.fueledCount) },
        {
          label: "Avg return",
          value: formatPct(avg),
          accent: avgAccent,
        },
        {
          label: "Best call",
          value: formatPct(best),
          accent: bestAccent,
        },
        { label: "Trusted", value: String(stats.trustedCallers), hint: "Unique callers" },
      ]}
      className=""
    />
  );
}
