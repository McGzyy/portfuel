import Link from "next/link";
import { GitCompare, Plus, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedRefreshButton } from "@/components/dashboard/FeedRefreshButton";
import { buildCompareHref } from "@/lib/dashboard/compare-symbols";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { COPY } from "@/lib/copy";
import type { AssetClass } from "@/lib/market/validate-symbol";

export function TickerActionBar({
  symbol,
  assetClass,
  proLocked,
  hasOwnOpenCall = false,
}: {
  symbol: string;
  assetClass: AssetClass;
  proLocked: boolean;
  hasOwnOpenCall?: boolean;
}) {
  const newCallHref = `/calls/new?asset=${assetClass}&symbol=${encodeURIComponent(symbol)}`;
  const feedHref = buildFeedHref({ q: symbol });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pf-border)] pt-4">
      <div className="flex flex-wrap gap-2">
        {hasOwnOpenCall ? (
          <Link href="#calls">
            <Button size="sm" variant="secondary" className="gap-1.5">
              Your open call
            </Button>
          </Link>
        ) : (
          <Link href={newCallHref}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              {COPY.publishCallCta}
            </Button>
          </Link>
        )}
        <Link
          href={feedHref}
          className="pf-chip-action h-9 gap-1.5 rounded-[var(--pf-radius)] px-3.5 text-xs"
        >
          <Rows3 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Feed · {symbol}
        </Link>
        {!proLocked ? (
          <Link
            href={buildCompareHref([symbol])}
            className="pf-chip-action h-9 gap-1.5 rounded-[var(--pf-radius)] px-3.5 text-xs"
          >
            <GitCompare className="h-3.5 w-3.5" strokeWidth={2.25} />
            Compare
          </Link>
        ) : null}
      </div>
      <FeedRefreshButton />
    </div>
  );
}
