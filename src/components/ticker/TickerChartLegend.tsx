import { cn } from "@/lib/utils";

export function TickerChartLegend({
  callCount,
  journalCount = 0,
  levelCount = 0,
  showDepth = false,
  embedded,
}: {
  callCount: number;
  journalCount?: number;
  levelCount?: number;
  showDepth?: boolean;
  embedded?: boolean;
}) {
  if (callCount === 0 && journalCount === 0 && levelCount === 0 && !showDepth) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-xs text-[var(--pf-gray-500)]",
        !embedded && "border-t border-[var(--pf-border)] bg-white"
      )}
    >
      {callCount > 0 ? (
        <>
          <span className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Markers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-emerald-600" />
            Long
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-rose-500" />
            Short
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-[var(--pf-red)]" />
            Fueled ({callCount})
          </span>
        </>
      ) : null}
      {journalCount > 0 ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          Journal ({journalCount})
        </span>
      ) : null}
      {levelCount > 0 ? (
        <>
          <span className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Levels
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-8 border-t border-dashed border-slate-500" />
            Target / stop
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-8 border-t border-slate-500" />
            Entry
          </span>
        </>
      ) : null}
      {showDepth ? (
        <>
          <span className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Depth
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-slate-300" />
            Volume
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-6 border-t-2 border-blue-600" />
            SMA 20
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-6 border-t border-dashed border-violet-600" />
            VWAP
          </span>
        </>
      ) : null}
    </div>
  );
}
