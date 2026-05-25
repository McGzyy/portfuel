import { cn } from "@/lib/utils";

export function TickerChartLegend({
  callCount,
  embedded,
}: {
  callCount: number;
  embedded?: boolean;
}) {
  if (callCount === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 px-4 py-2.5 text-xs text-[var(--pf-gray-500)]",
        !embedded && "border-t border-[var(--pf-border)] bg-white"
      )}
    >
      <span className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Chart markers
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--pf-red)]" />
        Member call ({callCount} on chart)
      </span>
      <span className="text-[var(--pf-gray-400)]">Hover markers for caller labels</span>
    </div>
  );
}
