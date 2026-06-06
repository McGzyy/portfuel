import Link from "next/link";
import { LeaderboardTable } from "@/components/rankings/LeaderboardTable";
import { RankingsTrustedNote } from "@/components/rankings/RankingsTrustedNote";
import { RankingsSummaryBar } from "@/components/rankings/RankingsSummaryBar";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { RankingsCommandHeader } from "@/components/rankings/RankingsCommandHeader";
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
  const topMember = rows[0] ?? null;

  return (
    <div className="space-y-6">
      <RankingsCommandHeader
        summary={summary}
        topMember={topMember}
        loggedIn={loggedIn}
      />

      {loggedIn ? (
        <WorkspaceQuickActions proUnlocked={!proLocked} />
      ) : null}

      <RankingsSummaryBar summary={summary} proLocked={proLocked} proGateCta={proGateCta} />
      <RankingsTrustedNote />
      <div className="pf-workspace-panel overflow-hidden">
        <LeaderboardTable rows={rows} embedded />
      </div>

      {!loggedIn ? (
        <p className="text-center text-sm text-[var(--pf-gray-500)]">
          Want the live workspace and full theses?{" "}
          <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
            {COPY.ctaGetAccess}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
