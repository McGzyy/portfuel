import { cn } from "@/lib/utils";

/** Lightweight score viz for rankings (G2) — no market API. */
export function RankScoreBar({
  score,
  maxScore,
  className,
}: {
  score: number;
  maxScore: number;
  className?: string;
}) {
  const pct = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;

  return (
    <div
      className={cn("flex items-center justify-end gap-2", className)}
      title={`${score.toFixed(1)} of ${maxScore.toFixed(1)} leader score`}
    >
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--pf-chart-muted)]">
        <div
          className="pf-bar-fill bg-slate-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
