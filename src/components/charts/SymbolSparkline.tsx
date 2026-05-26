"use client";

import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { useSparkline } from "@/components/charts/SparklineProvider";
import { cn } from "@/lib/utils";

export function SymbolSparkline({
  symbol,
  width = 52,
  height = 24,
  className,
}: {
  symbol: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const points = useSparkline(symbol);

  return (
    <MiniSparkline
      points={points}
      width={width}
      height={height}
      className={cn("shrink-0", className)}
    />
  );
}
