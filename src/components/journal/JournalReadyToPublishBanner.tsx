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
      className="rounded-[var(--pf-radius-lg)] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-5 py-4 shadow-[var(--pf-shadow-sm)] sm:px-6"
      aria-label="Ready to publish"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            <Megaphone className="h-3.5 w-3.5" strokeWidth={2.25} />
            Ready to publish
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {readyItems.length} idea{readyItems.length === 1 ? "" : "s"} finished research — publish
            when you want the community to see your thesis.
          </p>
          <p className="mt-1 text-xs text-emerald-900/80">
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
              className="inline-flex h-8 items-center rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Publish {item.symbol}
            </Link>
            <Link
              href={journalSymbolPath(item.symbol, { section: "checklist" })}
              className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-900 hover:border-emerald-300"
            >
              Review
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
