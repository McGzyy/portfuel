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
    <div className="pf-workspace-panel overflow-hidden">
      <p className="px-4 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Community on this ticker
      </p>
      <MetricsStrip
        variant="embedded"
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
        {
          label: "Trusted callers",
          value: String(stats.trustedCallers),
        },
      ]}
      />
      <p className="border-t border-[var(--pf-border)] px-4 py-2 text-[10px] text-[var(--pf-gray-400)] sm:hidden">
        Swipe for more stats →
      </p>
    </div>
  );
}
