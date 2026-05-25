import Link from "next/link";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { cn } from "@/lib/utils";

export function MemberQuotaStrip({
  quota,
  showUpgrade,
  className,
}: {
  quota: WeeklyQuotaStatus;
  showUpgrade?: boolean;
  className?: string;
}) {
  const atLimit = quota.remaining === 0;
  const pct = quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-4 py-3 shadow-[var(--pf-shadow-sm)]",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          This week · {quota.tierLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--pf-black)]">
          <span className="tabular-nums">{quota.used}</span>
          <span className="text-[var(--pf-gray-500)]"> / {quota.limit} calls published</span>
        </p>
        <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              atLimit ? "bg-[var(--pf-red)]" : "bg-emerald-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {atLimit ? (
          <p className="mt-1.5 text-xs text-[var(--pf-red)]">
            Weekly limit reached.
            {showUpgrade ? " Upgrade to Pro for 6 calls/week." : " Resets on a rolling 7-day window."}
          </p>
        ) : null}
      </div>
      {showUpgrade && quota.tier === "member" ? (
        <Link
          href="/profile"
          className="shrink-0 rounded-[var(--pf-radius)] bg-[var(--pf-red-muted)] px-3 py-2 text-xs font-semibold text-[var(--pf-red)] hover:bg-[var(--pf-red)]/15"
        >
          Upgrade to Pro
        </Link>
      ) : null}
    </div>
  );
}
