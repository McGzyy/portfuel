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
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {hasOwnOpenCall ? (
          <Link href="#calls" className="col-span-2 sm:col-span-1">
            <Button size="sm" variant="secondary" className="w-full gap-1.5 sm:w-auto">
              Your open call
            </Button>
          </Link>
        ) : (
          <Link href={newCallHref} className="col-span-2 sm:col-span-1">
            <Button size="sm" className="w-full gap-1.5 sm:w-auto">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              {COPY.publishCallCta}
            </Button>
          </Link>
        )}
        <Link
          href={feedHref}
          className="pf-chip-action inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--pf-radius)] px-3.5 text-xs sm:w-auto"
        >
          <Rows3 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Feed · {symbol}
        </Link>
        {!proLocked ? (
          <Link
            href={buildCompareHref([symbol])}
            className="pf-chip-action inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--pf-radius)] px-3.5 text-xs sm:w-auto"
          >
            <GitCompare className="h-3.5 w-3.5" strokeWidth={2.25} />
            Compare
          </Link>
        ) : null}
      </div>
      <div className="flex justify-stretch sm:justify-end">
        <FeedRefreshButton />
      </div>
    </div>
  );
}
