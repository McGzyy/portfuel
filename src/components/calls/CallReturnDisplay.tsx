import { cn, formatPct } from "@/lib/utils";
import { showPeakedLabel } from "@/lib/scoring/call-credit";

export function CallReturnDisplay({
  returnPct,
  peakReturnPct,
  closedAt,
}: {
  returnPct: number | null;
  peakReturnPct?: number | null;
  closedAt?: string | null;
}) {
  const retClass =
    returnPct == null ? "text-[var(--pf-gray-500)]" : returnPct >= 0 ? "pf-return-up" : "pf-return-down";
  const peaked = showPeakedLabel({
    return_pct: returnPct,
    peak_return_pct: peakReturnPct,
    closed_at: closedAt,
  });

  return (
    <div className="text-right">
      <p className={cn("text-xl font-bold tabular-nums tracking-tight", retClass)}>
        {formatPct(returnPct)}
      </p>
      {peaked && peakReturnPct != null ? (
        <p className="text-[10px] font-medium tabular-nums text-[var(--pf-gray-500)]">
          Peaked {formatPct(peakReturnPct)}
        </p>
      ) : null}
      {closedAt ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Closed
        </p>
      ) : null}
    </div>
  );
}
