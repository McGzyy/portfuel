import { cn } from "@/lib/utils";

export function TickerChartLegend({
  callCount,
  journalCount = 0,
  levelCount = 0,
  hasYourLevels = false,
  hasDeskLevels = false,
  showDepth = false,
  embedded,
  callModal = false,
}: {
  callCount: number;
  journalCount?: number;
  levelCount?: number;
  hasYourLevels?: boolean;
  hasDeskLevels?: boolean;
  showDepth?: boolean;
  embedded?: boolean;
  callModal?: boolean;
}) {
  if (callCount === 0 && journalCount === 0 && levelCount === 0 && !showDepth) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-xs text-[var(--pf-gray-500)]",
        !embedded && "border-t border-[var(--pf-border)] bg-[var(--pf-surface)]"
      )}
    >
      {callCount > 0 ? (
        <>
          <span className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Calls
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[18px] w-[18px] rounded-full ring-2 ring-emerald-500" />
            Long
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[18px] w-[18px] rounded-full ring-2 ring-rose-500" />
            Short
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative h-[18px] w-[18px] rounded-full ring-[2.5px] ring-[var(--pf-red)]">
              <span className="absolute -bottom-px -right-px h-1.5 w-1.5 rounded-full bg-[var(--pf-red)]" />
            </span>
            Fueled ({callCount})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative h-[18px] w-[18px] rounded-full bg-indigo-100 ring-2 ring-indigo-500">
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-indigo-600 px-0.5 text-[8px] font-bold text-white">
                +2
              </span>
            </span>
            Same-day cluster
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
          {hasYourLevels ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-8 border-t border-slate-500" />
                Your entry
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-8 border-t border-dashed border-emerald-600" />
                Your target / stop
              </span>
            </>
          ) : null}
          {hasDeskLevels ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-8 border-t border-[var(--pf-red)]" />
                Desk entry
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-8 border-t border-dashed border-[var(--pf-red)]" />
                Desk target / stop
              </span>
            </>
          ) : null}
          {!hasYourLevels && !hasDeskLevels ? (
            <>
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
      {callCount > 0 || journalCount > 0 ? (
        <span className="text-[10px] text-[var(--pf-gray-400)]">
          {callModal
            ? "Hover avatar · click to open call"
            : journalCount > 0 && callCount === 0
              ? "Click dot → journal note"
              : "Member avatars mark each call · click to open thesis"}
        </span>
      ) : null}
    </div>
  );
}
