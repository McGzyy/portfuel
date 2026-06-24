import Link from "next/link";
import { MemberOpenBookLiveStats } from "@/components/book/MemberOpenBookLiveStats";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { MarketQuoteContextLine } from "@/components/market/MarketQuoteContextLine";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";

export function MemberOpenBookHeader({
  summary,
  username,
  isPro = false,
  quotesUpdatedAt,
  deskOpenCount = 0,
}: {
  summary: MemberOpenBookSummary;
  username: string;
  isPro?: boolean;
  quotesUpdatedAt?: string | null;
  deskOpenCount?: number;
}) {
  const subtitle =
    summary.openCount > 0
      ? `${summary.openCount} live thesis${summary.openCount === 1 ? "" : "es"} across ${summary.uniqueSymbols} symbol${summary.uniqueSymbols === 1 ? "" : "s"} — marks refresh on the schedule below.`
      : deskOpenCount > 0
        ? `${deskOpenCount} open Fueled desk position${deskOpenCount === 1 ? "" : "s"} on your house book — personal member calls are tracked separately below.`
        : "Your published member calls with open entry, target, and stop appear here — not broker sync. Fueled desk calls live on the Desk page.";

  return (
    <header className="space-y-4">
      <WorkspacePageHeader
        eyebrow="Workspace · Positions"
        title="Your positions"
        description={
          <>
            {subtitle}
            {summary.openCount > 0 ? (
              <MarketQuoteContextLine
                className="mt-2"
                isPro={isPro}
                updatedAt={quotesUpdatedAt}
              />
            ) : null}
          </>
        }
        footerLink={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {deskOpenCount > 0 ? (
              <Link
                href="/dashboard/desk"
                className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
              >
                Fueled desk book →
              </Link>
            ) : null}
            <Link
              href={`/member/${username}`}
              className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Public track record →
            </Link>
          </span>
        }
      />

      {summary.openCount > 0 ? (
        <MemberOpenBookLiveStats initialSummary={summary} />
      ) : null}
    </header>
  );
}
