import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { LeaderboardTable } from "@/components/rankings/LeaderboardTable";
import { RankingsTrustedNote } from "@/components/rankings/RankingsTrustedNote";
import { RankingsSummaryBar } from "@/components/rankings/RankingsSummaryBar";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Rankings",
  description: `Member leaderboard and rank scores on ${SITE_NAME} — ${SITE_TAGLINE}.`,
};

export default async function RankingsPage() {
  const session = await getSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  let rows: Awaited<ReturnType<typeof fetchLeaderboard>> = [];

  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      rows = await fetchLeaderboard(30);
    } catch (e) {
      console.error("[rankings]", e);
    }
  }

  const summary = summarizeRankings(rows);

  return (
    <>
      <SiteHeader user={session ? toHeaderUser(session) : undefined} showAuth={!session} />
      <div className="pf-app-bg flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          {session ? (
            <WorkspaceBackLink href="/dashboard" label="Workspace" />
          ) : null}

          <div className={session ? "mt-6" : undefined}>
            <WorkspacePageHeader
              eyebrow="Community"
              title="Rankings"
              description="Ranked by cumulative call score — return performance plus community votes. Refreshes when quotes update."
              className="mb-8 pb-8"
            />
          </div>

          <div className="mt-8">
            <RankingsSummaryBar
              summary={summary}
              proLocked={proLocked}
              proGateCta={proGateCta}
            />
            <RankingsTrustedNote />
            <div className="pf-workspace-panel mt-6 overflow-hidden">
              <LeaderboardTable rows={rows} embedded />
            </div>
          </div>

          {!session ? (
            <p className="mt-8 text-center text-sm text-[var(--pf-gray-500)]">
              Want the live workspace and full theses?{" "}
              <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
                {COPY.ctaGetAccess}
              </Link>
            </p>
          ) : (
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/dashboard">
                <Button variant="secondary">Workspace</Button>
              </Link>
              <Link href="/dashboard/feed">
                <Button>Member feed</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
