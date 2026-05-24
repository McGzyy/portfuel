import { formatPct } from "@/lib/utils";
import type { FeedSummary } from "@/lib/calls/feed-summary";

export function FeedSummaryBar({
  summary,
  mode,
}: {
  summary: FeedSummary;
  mode: "latest" | "performing";
}) {
  if (summary.count === 0) return null;

  const items = [
    {
      label: "Avg return",
      value: formatPct(summary.avgReturnPct),
      hint: mode === "performing" ? "30-day movers" : "In this feed",
    },
    {
      label: "Winners",
      value: String(summary.winners),
      hint: "Positive P&L",
    },
    {
      label: "Fueled",
      value: String(summary.fueledCount),
      hint: "PortFuel desk",
    },
    {
      label: "Long / Short",
      value: `${summary.longCount} / ${summary.shortCount}`,
      hint: "Position mix",
    },
    {
      label: "Avg to target",
      value:
        summary.avgTargetProgress != null
          ? `${summary.avgTargetProgress.toFixed(0)}%`
          : "—",
      hint: "Price vs target",
    },
  ];

  return (
    <section
      className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white/90 p-4 shadow-[var(--pf-shadow-sm)] backdrop-blur-sm"
      aria-label="Feed analytics"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Feed pulse
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
              {item.label}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-[var(--pf-black)]">
              {item.value}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--pf-gray-400)]">{item.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
