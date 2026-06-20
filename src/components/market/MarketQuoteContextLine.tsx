"use client";

import { MarketSessionBadge } from "@/components/market/MarketSessionBadge";
import { formatQuoteFreshnessLabel } from "@/lib/market/quote-freshness";
import type { AssetClass } from "@/lib/market/validate-symbol";
import { cn } from "@/lib/utils";

export function MarketQuoteContextLine({
  className,
  isPro = false,
  updatedAt,
  assetClass = "equity",
}: {
  className?: string;
  isPro?: boolean;
  updatedAt?: string | null;
  assetClass?: AssetClass | null;
}) {
  return (
    <p className={cn("text-xs text-[var(--pf-gray-500)]", className)}>
      {formatQuoteFreshnessLabel({ isPro, updatedAt })}
      {assetClass !== "crypto" ? (
        <>
          {" · "}
          <MarketSessionBadge variant="inline" assetClass={assetClass} />
        </>
      ) : null}
    </p>
  );
}
