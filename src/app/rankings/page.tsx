import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { LeaderboardTable } from "@/components/rankings/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { RankingsSummaryBar } from "@/components/rankings/RankingsSummaryBar";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export default async function RankingsPage() {
  const session = await getSession();
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
          <SectionHeader
            eyebrow="Leaderboard"
            title="Top callers"
            subtitle="Ranked by cumulative call score (return performance + community votes). Updated when prices refresh."
          />
          <div className="mt-10">
            <RankingsSummaryBar summary={summary} />
            <LeaderboardTable rows={rows} />
          </div>
          {!session ? (
            <p className="mt-8 text-center text-sm text-[var(--pf-gray-500)]">
              Want the live feed and full theses?{" "}
              <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
                {COPY.ctaGetAccess}
              </Link>
            </p>
          ) : (
            <div className="mt-8 text-center">
              <Link href="/dashboard">
                <Button variant="secondary">Back to dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
