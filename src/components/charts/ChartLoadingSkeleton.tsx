import { cn } from "@/lib/utils";

export function ChartLoadingSkeleton({
  height = 400,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-b from-[var(--pf-gray-100)] to-[var(--pf-gray-50)]",
        className
      )}
      style={{ height }}
      aria-hidden
    />
  );
}
