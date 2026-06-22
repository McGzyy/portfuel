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
}: {
  summary: MemberOpenBookSummary;
  username: string;
  isPro?: boolean;
  quotesUpdatedAt?: string | null;
}) {
  const subtitle =
    summary.openCount > 0
      ? `${summary.openCount} live thesis${summary.openCount === 1 ? "" : "es"} across ${summary.uniqueSymbols} symbol${summary.uniqueSymbols === 1 ? "" : "s"} — marks refresh on the schedule below.`
      : "Your published calls with open entry, target, and stop appear here as a portfolio view — not broker sync.";

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
          <Link
            href={`/member/${username}`}
            className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Public track record →
          </Link>
        }
      />

      {summary.openCount > 0 ? (
        <MemberOpenBookLiveStats initialSummary={summary} />
      ) : null}
    </header>
  );
}
