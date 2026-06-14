"use client";

import { Badge } from "@/components/ui/badge";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";
import { truncateThesis } from "@/lib/charts/chart-call-preview";
import { cn, formatPct, timeAgo } from "@/lib/utils";

export function ChartCallHoverTip({
  call,
  x,
  y,
  moreOnDay = 0,
  className,
}: {
  call: ChartCallPreview;
  x: number;
  y: number;
  moreOnDay?: number;
  className?: string;
}) {
  const name = call.users.display_name ?? call.users.pin;
  const isPending = call.call_state === "pending_entry";
  const ret = call.return_pct;
  const retClass =
    isPending
      ? "text-[var(--pf-gray-500)]"
      : ret == null
        ? "text-[var(--pf-gray-500)]"
        : ret >= 0
          ? "pf-return-up"
          : "pf-return-down";

  const left = Math.min(Math.max(x + 12, 8), 280);
  const top = Math.max(y - 8, 8);

  return (
    <div
      className={cn(
        "pf-chart-hover-tip pointer-events-none absolute z-20 w-[min(17rem,calc(100%-1rem))] rounded-lg border border-[var(--pf-border)] p-3 shadow-lg",
        className
      )}
      style={{ left, top }}
      role="tooltip"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--pf-black)]">{name}</span>
        <Badge variant={call.direction === "long" ? "long" : "short"} className="text-[10px]">
          {call.direction}
        </Badge>
        {call.is_fueled ? (
          <Badge variant="fueled" className="text-[10px]">
            Fueled
          </Badge>
        ) : null}
        <span className={cn("ml-auto text-xs font-bold tabular-nums", retClass)}>
          {isPending ? "Awaiting entry" : formatPct(ret)}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--pf-gray-400)]">{timeAgo(call.called_at)}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--pf-gray-700)]">
        {truncateThesis(call.thesis)}
      </p>
      <p className="mt-2 text-[10px] font-medium text-[var(--pf-gray-400)]">
        Click for full call
        {moreOnDay > 0 ? ` · ${moreOnDay + 1} calls this day` : ""}
      </p>
    </div>
  );
}
