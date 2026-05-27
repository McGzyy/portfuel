import Link from "next/link";
import { LeaderboardTable } from "@/components/rankings/LeaderboardTable";
import { RankingsTrustedNote } from "@/components/rankings/RankingsTrustedNote";
import { RankingsSummaryBar } from "@/components/rankings/RankingsSummaryBar";
import {
  WorkspacePageHeader,
  WorkspaceNewCallAction,
} from "@/components/dashboard/WorkspacePageHeader";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { LeaderboardEntry } from "@/lib/calls/leaderboard";
import type { RankingsSummary } from "@/lib/calls/rankings-summary";
import type { ProGateCta } from "@/lib/features/pro-intelligence";

export function RankingsPageContent({
  rows,
  summary,
  proLocked,
  proGateCta,
  loggedIn,
}: {
  rows: LeaderboardEntry[];
  summary: RankingsSummary;
  proLocked: boolean;
  proGateCta: ProGateCta;
  loggedIn: boolean;
}) {
  return (
    <>
      <WorkspacePageHeader
        eyebrow="Community"
        title="Rankings"
        description="Ranked by cumulative call score — return performance plus community votes. Refreshes when quotes update."
        action={loggedIn ? <WorkspaceNewCallAction /> : undefined}
        className="mb-6 pb-6"
      />

      <RankingsSummaryBar summary={summary} proLocked={proLocked} proGateCta={proGateCta} />
      <RankingsTrustedNote />
      <div className="pf-workspace-panel mt-6 overflow-hidden">
        <LeaderboardTable rows={rows} embedded />
      </div>

      {!loggedIn ? (
        <p className="mt-8 text-center text-sm text-[var(--pf-gray-500)]">
          Want the live workspace and full theses?{" "}
          <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
            {COPY.ctaGetAccess}
          </Link>
        </p>
      ) : null}
    </>
  );
}
