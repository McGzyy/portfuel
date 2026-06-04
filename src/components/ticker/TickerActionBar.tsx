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
}: {
  symbol: string;
  assetClass: AssetClass;
  proLocked: boolean;
}) {
  const newCallHref = `/calls/new?asset=${assetClass}&symbol=${encodeURIComponent(symbol)}`;
  const feedHref = buildFeedHref({ q: symbol });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pf-border)] pt-4">
      <div className="flex flex-wrap gap-2">
        <Link href={newCallHref}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            {COPY.publishCallCta}
          </Button>
        </Link>
        <Link
          href={feedHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
        >
          <Rows3 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Feed · {symbol}
        </Link>
        {!proLocked ? (
          <Link
            href={buildCompareHref([symbol])}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
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
