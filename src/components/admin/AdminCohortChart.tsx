"use client";

import type { SignupCohortWeek } from "@/lib/admin/cohorts";
import { cn } from "@/lib/utils";

function formatWeek(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdminCohortChart({ cohorts }: { cohorts: SignupCohortWeek[] }) {
  const maxSignups = Math.max(...cohorts.map((c) => c.signups), 1);
  const hasData = cohorts.some((c) => c.signups > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-[var(--pf-gray-500)]">No signups in the last 8 weeks.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2" style={{ minHeight: 140 }}>
        {cohorts.map((cohort) => {
          const h = Math.max(cohort.signups > 0 ? 8 : 4, (cohort.signups / maxSignups) * 100);
          const rate =
            cohort.activeRate == null ? null : Math.round(cohort.activeRate * 100);
          return (
            <div
              key={cohort.weekStart}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`Week of ${cohort.weekStart}: ${cohort.signups} signups, ${cohort.activeNow} still active`}
            >
              <span className="text-[9px] font-semibold tabular-nums text-[var(--pf-gray-500)]">
                {cohort.signups > 0 ? cohort.signups : ""}
              </span>
              <div
                className="relative w-full max-w-[28px] overflow-hidden rounded-t bg-[var(--pf-gray-100)]"
                style={{ height: 100 }}
              >
                <div
                  className="absolute bottom-0 w-full rounded-t bg-[var(--pf-red)]/85"
                  style={{ height: `${h}%` }}
                />
                {cohort.activeNow > 0 ? (
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-emerald-500/90"
                    style={{
                      height: `${cohort.signups > 0 ? (cohort.activeNow / cohort.signups) * h : 0}%`,
                    }}
                  />
                ) : null}
              </div>
              <span className="text-[8px] text-[var(--pf-gray-400)]">{formatWeek(cohort.weekStart)}</span>
              {rate != null && cohort.signups > 0 ? (
                <span
                  className={cn(
                    "text-[9px] font-bold tabular-nums",
                    rate >= 60 ? "text-emerald-600" : "text-[var(--pf-gray-500)]"
                  )}
                >
                  {rate}%
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-[var(--pf-gray-500)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[var(--pf-red)]/85" />
          Signups
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/90" />
          Still active
        </span>
        <span>% below bar = retention of that week&apos;s cohort</span>
      </div>
    </div>
  );
}
