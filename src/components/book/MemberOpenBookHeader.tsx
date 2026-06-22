import Link from "next/link";
import { MemberOpenBookLiveStats } from "@/components/book/MemberOpenBookLiveStats";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";

export function MemberOpenBookHeader({
  summary,
  username,
  isPro = false,
}: {
  summary: MemberOpenBookSummary;
  username: string;
  isPro?: boolean;
}) {
  const subtitle =
    summary.openCount > 0
      ? `${summary.openCount} live thesis${summary.openCount === 1 ? "" : "es"} across ${summary.uniqueSymbols} symbol${summary.uniqueSymbols === 1 ? "" : "s"} — ${quotesRefreshLabel({ isPro }).replace(/^./, (c) => c.toLowerCase())}.`
      : "Your published calls with open entry, target, and stop appear here as a portfolio view — not broker sync.";

  return (
    <header className="space-y-4">
      <WorkspacePageHeader
        eyebrow="Workspace · Positions"
        title="Your positions"
        description={subtitle}
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
