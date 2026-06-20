import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import { MarketQuoteContextLine } from "@/components/market/MarketQuoteContextLine";
import { MarketSessionBadge } from "@/components/market/MarketSessionBadge";
import { cn } from "@/lib/utils";

export function FueledDeskCommandHeader({
  weeklyNote,
  openPositions,
  totalDeskCalls,
  quotesUpdatedAt,
  isPro = false,
  className,
}: {
  weeklyNote?: string | null;
  openPositions: number;
  totalDeskCalls: number;
  quotesUpdatedAt?: string | null;
  isPro?: boolean;
  className?: string;
}) {
  const notePreview =
    weeklyNote && weeklyNote.length > 120
      ? `${weeklyNote.slice(0, 117)}…`
      : weeklyNote;

  return (
    <header
      className={cn(
        "pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Research · Fueled desk
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
              PortFuel Fueled desk
            </h1>
            <MarketSessionBadge assetClass="equity" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {openPositions} open house position{openPositions === 1 ? "" : "s"} · {totalDeskCalls}{" "}
            desk call{totalDeskCalls === 1 ? "" : "s"} on record — curated research separate from
            the member feed.
          </p>
          <MarketQuoteContextLine
            className="mt-2"
            isPro={isPro}
            updatedAt={quotesUpdatedAt}
            assetClass="equity"
          />
          {notePreview ? (
            <p className="mt-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-xs leading-relaxed text-[var(--pf-gray-600)]">
              <span className="font-semibold text-[var(--pf-gray-700)]">This week: </span>
              {notePreview}
            </p>
          ) : null}
          <Link
            href="/dashboard/feed?filter=fueled"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Fueled calls in member feed →
          </Link>
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
