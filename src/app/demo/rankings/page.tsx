import Link from "next/link";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { RankingsPageContent } from "@/components/rankings/RankingsPageContent";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { loadPreviewLeaderboard } from "@/lib/demo/workspace-preview";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { getSession } from "@/lib/auth/session";

export default async function DemoRankingsPage() {
  const session = await getSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

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
          Track record scores, win rates, and trusted badges — reputation is the product.
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
        proGateCta={proGateCta}
        loggedIn={false}
      />
    </div>
  );
}
