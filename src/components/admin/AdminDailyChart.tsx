"use client";

import { useMemo, useState } from "react";
import type { DailyCount } from "@/lib/admin/time-series";
import { cn } from "@/lib/utils";

export function AdminDailyChart({
  title,
  subtitle,
  series,
  accentClass = "bg-[var(--pf-red)]",
  totalLabel = "Total",
}: {
  title: string;
  subtitle?: string;
  series: DailyCount[];
  accentClass?: string;
  totalLabel?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...series.map((s) => s.count), 1);
  const total = useMemo(() => series.reduce((sum, s) => sum + s.count, 0), [series]);
  const peak = useMemo(() => Math.max(...series.map((s) => s.count), 0), [series]);

  const labelEvery = series.length > 60 ? 14 : series.length > 20 ? 7 : 5;

  return (
    <div className="pf-workspace-panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            {title}
          </p>
          {subtitle ? <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{subtitle}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            {totalLabel}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--pf-black)]">{total}</p>
          {peak > 0 ? (
            <p className="text-[10px] text-[var(--pf-gray-500)]">Peak {peak}/day</p>
          ) : null}
        </div>
      </div>

      {series.every((s) => s.count === 0) ? (
        <p className="mt-6 flex-1 text-sm text-[var(--pf-gray-500)]">No activity in this window.</p>
      ) : (
        <div className="mt-5 flex flex-1 flex-col">
          <div
            className="relative flex flex-1 items-end gap-px rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-2 pb-6 pt-3"
            style={{ minHeight: 160 }}
          >
            {series.map((s, i) => {
              const h = Math.max(s.count > 0 ? 6 : 2, (s.count / max) * 100);
              const isHovered = hovered === i;
              const showLabel = i === 0 || i === series.length - 1 || i % labelEvery === 0;
              return (
                <div
                  key={s.date}
                  className="relative flex min-w-0 flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {isHovered ? (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-md border border-[var(--pf-border)] bg-[var(--pf-surface)] px-2 py-1 text-[10px] font-semibold shadow-[var(--pf-shadow-sm)]">
                      <span className="text-[var(--pf-gray-500)]">{s.date}</span>
                      <span className="ml-1.5 tabular-nums text-[var(--pf-black)]">
                        {s.count}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "w-full max-w-[18px] rounded-t transition-all",
                      accentClass,
                      isHovered ? "opacity-100" : "opacity-80"
                    )}
                    style={{ height: `${h}%` }}
                  />
                  {showLabel ? (
                    <span className="absolute -bottom-5 text-[8px] text-[var(--pf-gray-400)]">
                      {s.date.slice(5)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
