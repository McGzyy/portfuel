import { formatQuoteFreshnessLabel } from "@/lib/market/quote-freshness";
import { cn } from "@/lib/utils";

export function MarketDataNote({
  className,
  isPro = false,
  updatedAt,
}: {
  className?: string;
  isPro?: boolean;
  /** ticker_snapshots.updated_at when available */
  updatedAt?: string | null;
}) {
  return (
    <p className={cn("text-xs text-[var(--pf-gray-500)]", className)}>
      {formatQuoteFreshnessLabel({ isPro, updatedAt })}
    </p>
  );
}
