import Link from "next/link";
import { Megaphone } from "lucide-react";
import { journalSymbolPath } from "@/lib/journal/paths";
import { buildPublishUrlFromHubEntry } from "@/lib/watchlist/journal-call-url";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export function JournalReadyToPublishBanner({
  readyItems,
  viewAllHref,
}: {
  readyItems: WatchlistEntry[];
  viewAllHref?: string;
}) {
  if (readyItems.length === 0) return null;

  const top = readyItems.slice(0, 3);

  return (
    <section
      className="pf-ready-publish-banner rounded-[var(--pf-radius-lg)] border px-5 py-4 shadow-[var(--pf-shadow-sm)] sm:px-6"
      aria-label="Ready to publish"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            <Megaphone className="h-3.5 w-3.5" strokeWidth={2.25} />
            Ready to publish
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-950 pf-ready-publish-title">
            {readyItems.length} idea{readyItems.length === 1 ? "" : "s"} finished research — publish
            when you want the community to see your thesis.
          </p>
          <p className="mt-1 text-xs text-emerald-900/80 pf-ready-publish-detail">
            Your journal stays private until you publish. Review the preview on the publish form
            before it goes live.
          </p>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            View all ready →
          </Link>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {top.map((item) => (
          <li key={item.symbol} className="flex flex-wrap items-center gap-1.5">
            <Link
              href={buildPublishUrlFromHubEntry(item)}
              className="pf-ready-publish-btn inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold"
            >
              Publish {item.symbol}
            </Link>
            <Link
              href={journalSymbolPath(item.symbol, { section: "checklist" })}
              className="pf-ready-publish-review inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold"
            >
              Review
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
