import type { WatchlistEntry } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";

export function JournalProgressMini({
  progress,
  className,
}: {
  progress: NonNullable<WatchlistEntry["journal_progress"]>;
  className?: string;
}) {
  const pct = Math.round((progress.required_completed / progress.required_total) * 100);

  return (
    <div className={cn("mt-2", className)}>
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
        <span className="text-[var(--pf-gray-500)]">
          Research {progress.required_completed}/{progress.required_total}
        </span>
        {progress.ready_to_publish ? (
          <span className="text-emerald-700">Ready to publish</span>
        ) : progress.has_ai_research ? (
          <span className="text-indigo-700">AI saved</span>
        ) : null}
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--pf-gray-100)]"
        role="progressbar"
        aria-valuenow={progress.required_completed}
        aria-valuemin={0}
        aria-valuemax={progress.required_total}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            progress.ready_to_publish ? "bg-emerald-500" : "bg-indigo-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
