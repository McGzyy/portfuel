import Link from "next/link";
import { DemoJoinFooter } from "@/components/demo/DemoJoinFooter";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { RankingsPageContent } from "@/components/rankings/RankingsPageContent";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { loadPreviewLeaderboard } from "@/lib/demo/workspace-preview";
import { getDemoPreviewTier, isDemoPreviewPro } from "@/lib/demo/tier";
import { getSession } from "@/lib/auth/session";

export default async function DemoRankingsPage() {
  const session = await getSession();
  const tier = await getDemoPreviewTier();
  const proLocked = !isDemoPreviewPro(tier);

  const { rows, source } = await loadPreviewLeaderboard(30);
  const summary = summarizeRankings(rows);

  return (
    <div className="space-y-6">
      <DemoPreviewSourceSync source={source} />

      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Rankings
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          Member leaderboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          Public reputation scores and win rates — follow top callers after join. Toggle Member vs
          Pro in the preview bar to see how Pro analytics strips look on rankings.
        </p>
        {session ? (
          <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
            Signed in —{" "}
            <Link href="/dashboard/rankings" className="font-semibold text-[var(--pf-red)]">
              open full rankings
            </Link>{" "}
            with follow suggestions.
          </p>
        ) : null}
      </header>

      <RankingsPageContent
        rows={rows}
        summary={summary}
        proLocked={proLocked}
        proGateCta="join"
        loggedIn={false}
      />

      <DemoJoinFooter tier={tier} />
    </div>
  );
}
