"use client";

import Link from "next/link";
import { barFillClass, type BarTone } from "@/lib/design/chart-bars";
import { cn } from "@/lib/utils";

export type BarChartItem = {
  id: string;
  label: string;
  value: number;
  href?: string;
  sublabel?: string;
  valueLabel?: string;
};

export function HorizontalBarChart({
  items,
  maxItems = 10,
  valueFormatter = (v) => String(v),
  barTone = "neutral",
  className,
}: {
  items: BarChartItem[];
  maxItems?: number;
  valueFormatter?: (value: number) => string;
  /** Brand red is reserved for marketing; data bars default to slate. */
  barTone?: BarTone;
  className?: string;
}) {
  const rows = items.slice(0, maxItems);
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">No data yet.</p>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className={cn("space-y-2.5 p-4", className)}>
      {rows.map((row) => {
        const pct = Math.max(4, Math.round((row.value / max) * 100));
        const inner = (
          <>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-bold text-[var(--pf-black)]">{row.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-[var(--pf-gray-600)]">
                {row.valueLabel ?? valueFormatter(row.value)}
              </span>
            </div>
            {row.sublabel ? (
              <p className="mt-0.5 truncate text-[10px] text-[var(--pf-gray-400)]">{row.sublabel}</p>
            ) : null}
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--pf-chart-muted)]">
              <div
                className={cn("pf-bar-fill", barFillClass(barTone))}
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={row.id}>
            {row.href ? (
              <Link href={row.href} className="block rounded-lg p-2 hover:bg-[var(--pf-gray-50)]">
                {inner}
              </Link>
            ) : (
              <div className="p-2">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
