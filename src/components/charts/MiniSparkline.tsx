"use client";

import { useIsDarkMode } from "@/components/appearance/AppearanceProvider";
import { sparklinePath } from "@/lib/charts/sparkline";
import { activeChartTheme } from "@/lib/charts/theme";
import type { LinePoint } from "@/lib/charts/types";
import { cn } from "@/lib/utils";

export function MiniSparkline({
  points,
  width = 52,
  height = 22,
  className,
}: {
  points: LinePoint[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const theme = activeChartTheme(useIsDarkMode());

  if (points.length < 2) {
    return (
      <span
        className={cn("inline-block shrink-0 rounded bg-[var(--pf-gray-100)]", className)}
        style={{ width, height }}
        aria-hidden
      />
    );
  }

  const values = points.map((p) => p.value);
  const up = values[values.length - 1] >= values[0];
  const path = sparklinePath(values, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={up ? theme.candle.up : theme.candle.down}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
