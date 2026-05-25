"use client";

import { CHART_RANGE_LABELS, type ChartRangeKey } from "@/lib/charts/types";
import { cn } from "@/lib/utils";

export function ChartRangeToolbar({
  value,
  onChange,
  className,
}: {
  value: ChartRangeKey;
  onChange: (range: ChartRangeKey) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-lg border border-[var(--pf-border)] bg-white p-1",
        className
      )}
      role="tablist"
      aria-label="Chart range"
    >
      {CHART_RANGE_LABELS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            value === key
              ? "bg-[var(--pf-black)] text-white"
              : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)]"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
