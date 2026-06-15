import { cn, formatPct } from "@/lib/utils";
import { showPeakedLabel } from "@/lib/scoring/call-credit";

export function CallReturnDisplay({
  returnPct,
  peakReturnPct,
  closedAt,
  callState,
  triggerEntryPrice,
  className,
  size = "default",
}: {
  returnPct: number | null;
  peakReturnPct?: number | null;
  closedAt?: string | null;
  callState?: string | null;
  triggerEntryPrice?: number | null;
  className?: string;
  size?: "default" | "hero";
}) {
  if (callState === "pending_entry") {
    return (
      <div className={cn("text-right", className)}>
        <p className="text-sm font-semibold text-amber-800">Awaiting entry</p>
        {triggerEntryPrice != null ? (
          <p className="text-[10px] font-medium tabular-nums text-[var(--pf-gray-500)]">
            @ ${triggerEntryPrice}
          </p>
        ) : null}
      </div>
    );
  }

  const retClass =
    returnPct == null ? "text-[var(--pf-gray-500)]" : returnPct >= 0 ? "pf-return-up" : "pf-return-down";
  const peaked = showPeakedLabel({
    return_pct: returnPct,
    peak_return_pct: peakReturnPct,
    closed_at: closedAt,
  });

  const retSize =
    size === "hero"
      ? "text-3xl font-extrabold tracking-tight sm:text-[2rem]"
      : "text-xl font-bold tracking-tight";

  return (
    <div className={cn("text-right", className)}>
      <p className={cn(retSize, "tabular-nums", retClass)}>
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
