import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { formatPct } from "@/lib/utils";
import type { FeedSummary } from "@/lib/calls/feed-summary";
import type { FeedTab } from "@/lib/dashboard/nav";
import { formatProIntelligenceLabel } from "@/lib/marketing/plans";

export function FeedSummaryBar({
  summary,
  mode,
  proLocked,
  proGateCta,
}: {
  summary: FeedSummary;
  mode: FeedTab;
  proLocked: boolean;
  proGateCta: ProGateCta;
}) {
  if (summary.count === 0) return null;

  const avg = summary.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);

  const baseItems = [
    {
      label: "Avg return",
      value: formatPct(avg),
      hint: mode === "performing" ? "30-day movers" : "This view",
      accent: avgAccent,
    },
    {
      label: "Winners",
      value: String(summary.winners),
      hint: "Positive P&L",
    },
    {
      label: "Long / short",
      value: `${summary.longCount} / ${summary.shortCount}`,
      hint: "Mix",
    },
    {
      label: "In view",
      value: String(summary.count),
      hint: "Calls",
    },
  ];

  const proItems = proLocked
    ? []
    : [
        {
          label: "Fueled",
          value: String(summary.fueledCount),
          hint: "Desk",
        },
        {
          label: "To target",
          value:
            summary.avgTargetProgress != null
              ? `${summary.avgTargetProgress.toFixed(0)}%`
              : "—",
          hint: "Avg progress",
        },
        {
          label: "Losers",
          value: String(summary.losers),
          hint: "Negative P&L",
        },
      ];

  return (
    <div className="pf-workspace-panel overflow-hidden">
      <div className="border-b border-[var(--pf-border)] px-4 py-3 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
          Feed pulse
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-600)]">
          {mode === "performing"
            ? "Snapshot of top performers in this view"
            : mode === "progress"
              ? "Calls sorted by progress toward stated targets"
              : "Community stats for your current filters"}
        </p>
      </div>
      <MetricsStrip variant="embedded" items={[...baseItems, ...proItems]} />
      {proLocked ? (
        <ProIntelligenceGate
          locked={proLocked}
          cta={proGateCta}
          title="Pro feed analytics"
          description={`Fueled counts, target progress averages, and progress board — included with ${formatProIntelligenceLabel()}.`}
          compact
        >
          <div className="px-4 py-3 text-xs text-[var(--pf-gray-500)]">Pro analytics unlocked.</div>
        </ProIntelligenceGate>
      ) : null}
    </div>
  );
}
