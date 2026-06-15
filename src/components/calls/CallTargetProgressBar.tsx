import { cn } from "@/lib/utils";

export function CallTargetProgressBar({
  progress,
  className,
  size = "default",
  label = "To target",
}: {
  progress: number;
  className?: string;
  size?: "default" | "slim";
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--pf-gray-600)]">{pct.toFixed(0)}%</span>
      </div>
      <div
        className={cn(
          "mt-1.5 overflow-hidden rounded-full bg-[var(--pf-gray-100)]",
          size === "slim" ? "h-1" : "h-2"
        )}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct.toFixed(0)}%`}
        />
      </div>
    </div>
  );
}
