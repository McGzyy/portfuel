"use client";

import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { useSparkline } from "@/components/charts/SparklineProvider";
import { cn } from "@/lib/utils";

export function SymbolSparkline({
  symbol,
  width = 52,
  height = 24,
  className,
  trendUp,
}: {
  symbol: string;
  width?: number;
  height?: number;
  className?: string;
  trendUp?: boolean | null;
}) {
  const points = useSparkline(symbol);

  return (
    <MiniSparkline
      points={points}
      width={width}
      height={height}
      trendUp={trendUp}
      className={cn("shrink-0", className)}
    />
  );
}
