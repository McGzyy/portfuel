import Link from "next/link";
import { MarketQuoteContextLine } from "@/components/market/MarketQuoteContextLine";
import { MarketSessionBadge } from "@/components/market/MarketSessionBadge";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export function FueledDeskCommandHeader({
  weeklyNote,
  openPositions,
  totalDeskCalls,
  quotesUpdatedAt,
  isPro = false,
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
    <WorkspacePageHeader
      eyebrow="Research · Fueled desk"
      title="PortFuel Fueled desk"
      titleAddon={<MarketSessionBadge assetClass="equity" />}
      description={
        <>
          {openPositions} open house position{openPositions === 1 ? "" : "s"} · {totalDeskCalls}{" "}
          desk call{totalDeskCalls === 1 ? "" : "s"} on record — curated research separate from
          the member feed.
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
        </>
      }
      footerLink={
        <Link
          href="/dashboard/feed?filter=fueled"
          className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Fueled calls in member feed →
        </Link>
      }
    />
  );
}
