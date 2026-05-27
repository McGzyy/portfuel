import { quotesRefreshLabel } from "@/lib/market/quote-cadence";
import { cn } from "@/lib/utils";

export function MarketDataNote({
  className,
  minutes,
}: {
  className?: string;
  minutes?: number;
}) {
  return (
    <p className={cn("text-xs text-[var(--pf-gray-500)]", className)}>
      {quotesRefreshLabel(minutes)}
    </p>
  );
}
