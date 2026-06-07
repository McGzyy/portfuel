import type { Metadata } from "next";
import { MemberOpenBookHeader } from "@/components/book/MemberOpenBookHeader";
import { MemberOpenBookPanel } from "@/components/book/MemberOpenBookPanel";
import { MemberOpenBookSymbols } from "@/components/book/MemberOpenBookSymbols";
import { OverviewPerformanceChart } from "@/components/dashboard/OverviewPerformanceChart";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { ProQuoteRefreshMount } from "@/components/market/ProQuoteRefreshMount";
import { fetchMemberOpenBook } from "@/lib/calls/member-book";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { requireDashboardSession } from "@/lib/dashboard/data";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Your open book",
};

export default async function DashboardBookPage() {
  const session = await requireDashboardSession();
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));
  const book = await fetchMemberOpenBook(session.userId);
  const performanceSeries = buildCumulativeReturnSeries(book.openCalls);

  return (
    <div className="space-y-6">
      {!proLocked ? <ProQuoteRefreshMount enabled /> : null}
      <MemberOpenBookHeader
        summary={book.summary}
        username={session.username}
        isPro={!proLocked}
      />
      <WorkspaceQuickActions proUnlocked={!proLocked} />

      {book.summary.openCount > 0 ? (
        <>
          <OverviewPerformanceChart
            points={performanceSeries}
            profileHref={`/member/${session.username}`}
          />
          <MemberOpenBookSymbols rows={book.summary.bySymbol} />
        </>
      ) : null}

      <MemberOpenBookPanel
        openCalls={book.openCalls}
        recentClosed={book.recentClosed}
        viewerUserId={session.userId}
        username={session.username}
        displayName={session.displayName}
        isAdmin={session.role === "admin"}
        isPro={!proLocked}
        proLocked={proLocked}
      />
    </div>
  );
}
