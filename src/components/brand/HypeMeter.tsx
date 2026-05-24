import { cn } from "@/lib/utils";

export function HypeMeter({ score, className }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--pf-gray-500)]">
        Hype
      </span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
        <div
          className="h-full rounded-full bg-[var(--pf-red)] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-[var(--pf-black)]">
        {clamped.toFixed(0)}
      </span>
    </div>
  );
}
