import Link from "next/link";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { CallCardData } from "@/components/calls/CallCard";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { formatPct } from "@/lib/utils";

export function ProFeedLeadersPanel({
  calls,
  locked,
  proGateCta,
}: {
  calls: CallCardData[];
  locked: boolean;
  proGateCta: ProGateCta;
}) {
  const leaders = [...calls]
    .filter((c) => c.target_progress != null)
    .sort((a, b) => (b.target_progress ?? 0) - (a.target_progress ?? 0))
    .slice(0, 8);

  const barItems = leaders.map((c) => ({
    id: c.id,
    label: c.symbol,
    value: Math.max(0, c.target_progress ?? 0),
    href: `/ticker/${c.symbol}`,
    sublabel: `@${c.username ?? c.pin} · ${formatPct(c.return_pct)} return`,
    valueLabel: `${Math.round(c.target_progress ?? 0)}% to target`,
  }));

  const body = (
    <ChartFrame
      title="Target progress leaders"
      subtitle="Calls closest to their stated targets in this feed view"
    >
      {leaders.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">
          No target progress data in this view yet.
        </p>
      ) : (
        <HorizontalBarChart items={barItems} maxItems={8} />
      )}
      {leaders.length > 0 ? (
        <div className="border-t border-[var(--pf-border)] px-4 py-3 text-center">
          <Link
            href="/dashboard/feed?tab=progress"
            className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            View full progress board →
          </Link>
        </div>
      ) : null}
    </ChartFrame>
  );

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      title="Pro feed analytics"
      description="Target progress leaders and desk-level stats — Pro Intelligence."
      compact
    >
      {body}
    </ProIntelligenceGate>
  );
}
