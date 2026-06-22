import Link from "next/link";
import { JournalHeaderAction } from "@/components/journal/JournalHeaderAction";
import { MarketSessionBadge } from "@/components/market/MarketSessionBadge";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import type { JournalNextUp } from "@/lib/journal/next-up";
import type { BookPostureSummary } from "@/lib/watchlist/book-posture";

const MAX_WATCHLIST = 24;

export function WatchlistCommandHeader({
  symbolCount,
  unreadAlerts,
  callsLast7d,
  nextUp,
  bookPosture,
}: {
  symbolCount: number;
  unreadAlerts: number;
  callsLast7d: number;
  nextUp?: JournalNextUp | null;
  bookPosture?: BookPostureSummary | null;
}) {
  const postureLine =
    bookPosture && bookPosture.inBook > 0
      ? [
          bookPosture.active > 0 ? `${bookPosture.active} active` : null,
          bookPosture.trimming > 0 ? `${bookPosture.trimming} trimming` : null,
          bookPosture.building > 0 ? `${bookPosture.building} building` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

  return (
    <WorkspacePageHeader
      eyebrow="Research · Watchlist"
      title="Watchlist"
      titleAddon={<MarketSessionBadge assetClass="equity" />}
      description={
        <>
          {symbolCount} of {MAX_WATCHLIST} symbols on your watchlist — add names here to research
          in your journal, then publish a call when ready.
          {unreadAlerts > 0 ? (
            <span className="font-semibold text-[var(--pf-red)]">
              {" "}
              · {unreadAlerts} new call alert{unreadAlerts === 1 ? "" : "s"}
            </span>
          ) : null}
          {callsLast7d > 0 ? (
            <span className="text-[var(--pf-gray-400)]">
              {" "}
              · {callsLast7d} member call{callsLast7d === 1 ? "" : "s"} on your list (7d)
            </span>
          ) : null}
          {postureLine ? (
            <>
              {" "}
              ·{" "}
              <Link
                href="/dashboard/journal?filter=in_book#journal-ideas"
                className="font-medium text-[var(--pf-gray-600)] hover:text-[var(--pf-red)] hover:underline"
              >
                Book: {postureLine}
              </Link>
            </>
          ) : null}
        </>
      }
      footerLink={
        <Link
          href="/dashboard"
          className="inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ← Workspace overview
        </Link>
      }
      action={nextUp && symbolCount > 0 ? <JournalHeaderAction nextUp={nextUp} /> : null}
    />
  );
}
