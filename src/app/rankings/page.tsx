import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { LeaderboardTable } from "@/components/rankings/LeaderboardTable";
import { RankingsSummaryBar } from "@/components/rankings/RankingsSummaryBar";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
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
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));

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

          <header
            className={session ? "mt-6 border-b border-[var(--pf-border)] pb-8" : "border-b border-[var(--pf-border)] pb-8"}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-red)]">
              Community rankings
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
              Leaderboard
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-500)]">
              Ranked by cumulative call score — return performance plus community votes. Refreshes
              when quotes update.
            </p>
          </header>

          <div className="mt-8">
            <RankingsSummaryBar summary={summary} proLocked={proLocked} />
            <div className="pf-workspace-panel overflow-hidden">
              <LeaderboardTable rows={rows} />
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
