import Link from "next/link";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { DemoReadOnlyFeed } from "@/components/demo/DemoReadOnlyFeed";
import { FueledDeskSection } from "@/components/dashboard/FueledDeskSection";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { loadPreviewFeedCalls, mapPreviewCallsForCards } from "@/lib/demo/workspace-preview";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { getSession } from "@/lib/auth/session";

export default async function DemoFeedPage() {
  const session = await getSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  const { calls: latestRaw, source } = await loadPreviewFeedCalls("latest");
  const latestCalls = await mapPreviewCallsForCards(latestRaw);
  const memberCalls = latestCalls.filter((c) => !c.is_fueled);
  const fueledCalls = latestCalls.filter((c) => c.is_fueled).slice(0, 4);
  const summary = summarizeFeed(memberCalls);

  return (
    <div className="space-y-6">
      <DemoPreviewSourceSync source={source} />

      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Member feed
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          Community calls
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          Verified member theses with live performance, votes, and chart markers — read-only in
          this preview.
        </p>
      </header>

      {fueledCalls.length > 0 ? (
        <FueledDeskSection calls={fueledCalls} readOnly deskHref="/demo/desk" />
      ) : null}

      {memberCalls.length > 0 ? (
        <>
          <FeedSummaryBar
            summary={summary}
            mode="latest"
            proLocked={proLocked}
            proGateCta={proGateCta}
          />
          <DemoReadOnlyFeed calls={memberCalls} />
        </>
      ) : (
        <div className="pf-workspace-panel px-6 py-12 text-center text-sm text-[var(--pf-gray-500)]">
          No member calls to preview yet.{" "}
          <Link href="/join" className="font-semibold text-[var(--pf-red)]">
            Join
          </Link>{" "}
          to publish the first thesis.
        </div>
      )}
    </div>
  );
}
