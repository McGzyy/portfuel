import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { barFillClass } from "@/lib/design/chart-bars";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { ReturnBucket } from "@/lib/charts/return-distribution";
import { cn } from "@/lib/utils";

export function MemberReturnDistribution({
  buckets,
  locked,
  proGateCta,
}: {
  buckets: ReturnBucket[];
  locked: boolean;
  proGateCta: ProGateCta;
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  const body = (
    <div className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Pro · return distribution
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        How your scored calls cluster by realized return.
      </p>
      {buckets.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">
          Publish calls with live returns to see your distribution.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {buckets.map((b) => (
            <li key={b.label}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[var(--pf-gray-700)]">{b.label}</span>
                <span className="tabular-nums text-[var(--pf-gray-500)]">
                  {b.count} call{b.count === 1 ? "" : "s"} · {b.pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--pf-chart-muted)]">
                <div
                  className={cn("pf-bar-fill", barFillClass(b.tone))}
                  style={{ width: `${Math.max(8, (b.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      title="Return distribution"
      description="See how your track record clusters across win/loss buckets — Pro Intelligence."
      compact
    >
      {body}
    </ProIntelligenceGate>
  );
}
