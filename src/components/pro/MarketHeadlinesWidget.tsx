import Link from "next/link";
import { Newspaper } from "lucide-react";
import { MarketHeadlineList } from "@/components/news/MarketHeadlineList";
import { fetchMarketHeadlinesPreview } from "@/lib/market/market-headlines";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";

export async function MarketHeadlinesWidget({
  watchlistSymbols,
}: {
  watchlistSymbols: string[];
}) {
  const headlines = await fetchMarketHeadlinesPreview(watchlistSymbols, 5);

  return (
    <div className="pf-workspace-panel flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-[var(--pf-red)]" strokeWidth={2.25} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Market headlines
        </p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
        Macro and crypto context — plus anything tagging symbols on your watchlist.
      </p>

      <div className="mt-4 flex-1">
        <MarketHeadlineList items={headlines} compact showRelated={false} />
      </div>

      <Link
        href={buildResearchHubHref("news")}
        className="mt-4 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
      >
        Open market headlines →
      </Link>
    </div>
  );
}
