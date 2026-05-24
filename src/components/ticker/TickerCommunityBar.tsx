import { formatPct } from "@/lib/utils";
import type { TickerCommunityStats } from "@/lib/calls/ticker-community-stats";

export function TickerCommunityBar({ stats }: { stats: TickerCommunityStats }) {
  if (stats.callCount === 0) return null;

  const items = [
    { label: "Member calls", value: String(stats.callCount) },
    { label: "Long / Short", value: `${stats.longCount} / ${stats.shortCount}` },
    { label: "Fueled", value: String(stats.fueledCount) },
    {
      label: "Avg return",
      value: formatPct(stats.avgReturnPct),
    },
    {
      label: "Best call",
      value: formatPct(stats.bestReturnPct),
    },
    { label: "Trusted callers", value: String(stats.trustedCallers) },
  ];

  return (
    <section
      className="mt-6 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white/90 p-4 shadow-[var(--pf-shadow-sm)]"
      aria-label="Community stats for this ticker"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Community on this ticker
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
              {item.label}
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--pf-black)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
