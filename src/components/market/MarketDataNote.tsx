import { quotesRefreshLabel } from "@/lib/market/quote-cadence";
import { cn } from "@/lib/utils";

export function MarketDataNote({
  className,
  isPro = false,
}: {
  className?: string;
  isPro?: boolean;
}) {
  return (
    <p className={cn("text-xs text-[var(--pf-gray-500)]", className)}>
      {quotesRefreshLabel({ isPro })}
    </p>
  );
}
