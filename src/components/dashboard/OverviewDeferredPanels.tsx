import Link from "next/link";
import { Suspense } from "react";
import { AdminCommunityHint } from "@/components/dashboard/AdminCommunityHint";
import { WorkspaceOnboardingChecklist } from "@/components/dashboard/WorkspaceOnboardingChecklist";
import { WorkspaceChecklistCompleteBanner } from "@/components/dashboard/WorkspaceChecklistCompleteBanner";
import { WorkspaceLiveBar } from "@/components/dashboard/WorkspaceLiveBar";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { FueledDeskPreview } from "@/components/dashboard/FueledDeskPreview";
import { FueledTrackRecordPanel } from "@/components/dashboard/FueledTrackRecordPanel";
import { fetchFueledTrackRecord } from "@/lib/fueled/track-record";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { FeedPreviewList } from "@/components/dashboard/FeedPreviewList";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import type { CallCardData } from "@/components/calls/CallCard";
import type { UserCallRow } from "@/lib/calls/call-fields";
import { mapCallForCard } from "@/lib/dashboard/data";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { FollowingFeedPanel } from "@/components/dashboard/FollowingFeedPanel";
import { fetchDeskBrief } from "@/lib/desk/brief";
import { fetchFueledDeskCalls } from "@/lib/calls/service";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";
import { mergeDeskPortfolioDisplay } from "@/lib/desk/portfolio-display";
import { fetchEmailPrefs } from "@/lib/email/preferences";
import { AlertsEmailSetupStrip } from "@/components/dashboard/AlertsEmailSetupStrip";
import { fetchJournalHighlights } from "@/lib/watchlist/journal-highlights";
import { WatchlistJournalPulse } from "@/components/watchlist/WatchlistJournalPulse";
import { JournalReadyToPublishBanner } from "@/components/journal/JournalReadyToPublishBanner";
import { JournalContinueCard } from "@/components/journal/JournalContinueCard";
import { BookPostureStrip } from "@/components/watchlist/BookPostureStrip";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { OverviewProCommandSectionLoader } from "@/components/dashboard/OverviewProCommandSectionLoader";
import { OverviewProCommandSkeleton } from "@/components/dashboard/OverviewProCommandSkeleton";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { COPY } from "@/lib/copy";
import { formatPct, formatPrice } from "@/lib/utils";
import { fetchWorkspacePulse } from "@/lib/workspace/pulse";
import { fetchReferralStats } from "@/lib/referrals/service";
import {
  shouldShowReferralOverviewPrompt,
  toReferralInvitePrompt,
} from "@/lib/referrals/prompt";
import { ReferralOverviewStrip } from "@/components/referrals/ReferralInviteStrip";
import { OverviewPanelGate } from "@/components/dashboard/OverviewPanelGate";
import { WorkspaceWalkthroughTips } from "@/components/dashboard/WorkspaceWalkthroughTips";
import { WorkspacePageSkeleton } from "@/components/dashboard/WorkspacePageSkeleton";
import type { SessionPayload } from "@/lib/auth/session-types";
import type { FollowedMember } from "@/lib/follows/types";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import type { summarizeFeed } from "@/lib/calls/feed-summary";

export function OverviewDeferredSkeleton() {
  return <WorkspacePageSkeleton blocks={4} />;
}

export async function OverviewDeferredPanels({
  session,
  isPro,
  proLocked,
  ownCalls,
  openCallCards,
  latestPreviews,
  followingPreviews,
  followingMembers,
  fueledCallsCount,
  featuredDesk,
  watchlistItems,
  communityPulse,
  quoteUpdatedAtBySymbol,
}: {
  session: SessionPayload;
  isPro: boolean;
  proLocked: boolean;
  ownCalls: UserCallRow[];
  openCallCards: CallCardData[];
  latestPreviews: CallPreviewData[];
  followingPreviews: CallPreviewData[];
  followingMembers: FollowedMember[];
  fueledCallsCount: number;
  featuredDesk: CallPreviewData | null;
  watchlistItems: WatchlistEntry[];
  communityPulse: ReturnType<typeof summarizeFeed>;
  quoteUpdatedAtBySymbol: Record<string, string>;
}) {
  const [
    emailPrefs,
    deskBrief,
    portfolio,
    fueledDeskRaw,
    fueledTrackRecord,
    journalIdeas,
    workspacePulse,
    referralStats,
  ] = await Promise.all([
    fetchEmailPrefs(session.userId).catch(() => null),
    fetchDeskBrief(),
    fetchDeskPortfolio(),
    fetchFueledDeskCalls(),
    fetchFueledTrackRecord(),
    fetchJournalHighlights(session.userId).catch(
      () => [] as Awaited<ReturnType<typeof fetchJournalHighlights>>
    ),
    fetchWorkspacePulse(session.userId, isPro).catch(() => null),
    fetchReferralStats(session.userId, session.username).catch(() => null),
  ]);

  const fueledDeskCards = fueledDeskRaw.map((c) => mapCallForCard(c));
  const displayPortfolio = mergeDeskPortfolioDisplay(portfolio, fueledDeskCards);
  const openDeskPortfolio = displayPortfolio.filter((e) => e.status === "open");
  const watchlistCount = watchlistItems.length;
  const journalThesisCount = watchlistItems.filter((i) => i.has_thesis).length;
  const watchlistPreview = watchlistItems.slice(0, 6);

  let referralPrompt = null;
  if (referralStats) {
    const prompt = toReferralInvitePrompt(referralStats);
    if (shouldShowReferralOverviewPrompt(prompt, { publishedCall: ownCalls.length > 0 })) {
      referralPrompt = prompt;
    }
  }

  const journalReadyItems = watchlistItems.filter((i) => i.journal_progress?.ready_to_publish);
  const journalNextUp = pickJournalNextUp(watchlistItems);

  return (
    <>
      <OverviewPanelGate panelId="live_bar">
        {workspacePulse ? <WorkspaceLiveBar initial={workspacePulse} compact /> : null}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="journal_nudge">
        {journalReadyItems.length > 0 ? (
          <JournalReadyToPublishBanner
            readyItems={journalReadyItems}
            viewAllHref="/dashboard/journal?filter=ready#journal-ideas"
          />
        ) : journalNextUp ? (
          <JournalContinueCard nextUp={journalNextUp} />
        ) : null}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="book_posture">
        {watchlistCount > 0 ? <BookPostureStrip items={watchlistItems} /> : null}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="pro_command">
        {isPro && session.subscriptionStatus === "active" ? (
          <Suspense fallback={<OverviewProCommandSkeleton />}>
            <OverviewProCommandSectionLoader
              username={session.username}
              openCallCards={openCallCards}
              ownCalls={ownCalls}
              journalReadyItems={journalReadyItems}
              deskWeeklyNote={deskBrief.weeklyNote}
              watchlistItems={watchlistItems}
            />
          </Suspense>
        ) : null}
      </OverviewPanelGate>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <OverviewPanelGate panelId="fueled_desk">
            <section className="pf-fueled-desk p-5 sm:p-6" aria-label="PortFuel Fueled desk">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="pf-eyebrow">PortFuel Fueled</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight">Fueled desk</h2>
                  <p className="mt-1 max-w-xl text-sm text-slate-400">
                    House research and model portfolio
                  </p>
                </div>
                <Link
                  href="/dashboard/desk"
                  className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
                >
                  Open Fueled desk →
                </Link>
              </div>
              <FueledDeskPreview
                featured={featuredDesk}
                totalDeskCalls={fueledCallsCount}
                weeklyNote={deskBrief.weeklyNote}
              />
            </section>
          </OverviewPanelGate>

          <OverviewPanelGate panelId="member_feed">
            <WorkspacePanel
              title="Member feed"
              subtitle="Latest community theses"
              href={buildFeedHref({})}
            >
              {latestPreviews.length === 0 ? (
                <CallsEmptyState
                  title="No member calls yet"
                  description="Community theses appear here as members publish. Browse the feed or follow top callers from rankings."
                  showPublishCta={false}
                  secondaryHref={buildFeedHref({})}
                  secondaryLabel="Browse feed"
                />
              ) : (
                <FeedPreviewList
                  previews={latestPreviews}
                  quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
                  isPro={isPro}
                />
              )}
            </WorkspacePanel>
          </OverviewPanelGate>
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <OverviewPanelGate panelId="following">
            <FollowingFeedPanel
              following={followingMembers}
              previews={followingPreviews}
              quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
              isPro={isPro}
            />
          </OverviewPanelGate>

          <OverviewPanelGate panelId="watchlist">
            <WorkspacePanel
              title="Watchlist"
              subtitle="Symbols you follow"
              href="/dashboard/watchlist"
            >
              {watchlistPreview.length === 0 ? (
                <CallsEmptyState
                  title="Watchlist is empty"
                  description="Track symbols you care about — prices, alerts, and journal ideas live on your watchlist."
                  showPublishCta={false}
                  secondaryHref="/dashboard/watchlist"
                  secondaryLabel="Add symbols"
                />
              ) : (
                <ul>
                  {watchlistPreview.map((w) => (
                    <li key={w.symbol}>
                      <Link href={`/ticker/${w.symbol}`} className="pf-watchlist-mini">
                        <span className="flex items-center gap-1.5 font-mono font-bold text-[var(--pf-black)]">
                          {w.symbol}
                          {w.has_unread_call_alert ? (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-[var(--pf-red)]"
                              aria-label="New community call"
                            />
                          ) : null}
                        </span>
                        <span className="text-xs tabular-nums text-[var(--pf-gray-500)]">
                          {w.has_unread_call_alert
                            ? COPY.watchlistNewCall
                            : w.last_price != null
                              ? `$${formatPrice(Number(w.last_price))}`
                              : formatPct(w.return_pct)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </WorkspacePanel>
          </OverviewPanelGate>

          <OverviewPanelGate panelId="fueled_portfolio">
            <WorkspacePanel
              title="Fueled portfolio"
              subtitle="Open house positions"
              href="/dashboard/desk"
            >
              {openDeskPortfolio.length > 0 ? (
                <div className="divide-y divide-[var(--pf-border)]">
                  {openDeskPortfolio.slice(0, 4).map((e) => (
                    <Link
                      key={e.id}
                      href={`/ticker/${e.symbol}`}
                      className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-[var(--pf-gray-50)]"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                          {e.symbol}
                        </span>
                        <p className="text-xs text-[var(--pf-gray-500)]">
                          {e.direction} · {e.conviction}/5
                        </p>
                      </div>
                      <span
                        className={
                          e.return_pct == null
                            ? "text-xs font-bold tabular-nums text-[var(--pf-gray-500)]"
                            : e.return_pct >= 0
                              ? "text-xs font-bold tabular-nums text-emerald-600"
                              : "text-xs font-bold tabular-nums text-rose-600"
                        }
                      >
                        {formatPct(e.return_pct)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-[var(--pf-gray-500)]">No open desk positions right now.</p>
                  <p className="mt-1 text-xs text-[var(--pf-gray-400)]">
                    House theses and model portfolio live on the Fueled desk.
                  </p>
                  <Link
                    href="/dashboard/desk"
                    className="mt-4 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
                  >
                    Open Fueled desk →
                  </Link>
                </div>
              )}
            </WorkspacePanel>
          </OverviewPanelGate>
        </div>
      </div>

      <OverviewPanelGate panelId="fueled_track_record">
        <FueledTrackRecordPanel record={fueledTrackRecord} />
      </OverviewPanelGate>

      <OverviewPanelGate panelId="journal_pulse">
        {journalIdeas.length > 0 ? <WatchlistJournalPulse ideas={journalIdeas} /> : null}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="alerts_email">
        <AlertsEmailSetupStrip
          watchlistCount={watchlistCount}
          emailInstantEnabled={emailPrefs?.emailInstantEnabled ?? false}
          notifyEmail={emailPrefs?.notifyEmail ?? null}
          emailVerified={session.emailVerified}
        />
      </OverviewPanelGate>

      <OverviewPanelGate panelId="onboarding">
        {session.role !== "admin" ? (
          <>
            <WorkspaceWalkthroughTips
              enabled={
                !(ownCalls.length > 0 && watchlistCount > 0 && followingMembers.length > 0)
              }
            />
            <WorkspaceOnboardingChecklist
              publishedCall={ownCalls.length > 0}
              watchlistCount={watchlistCount}
              journalThesisCount={journalThesisCount}
              followingCount={followingMembers.length}
            />
            <WorkspaceChecklistCompleteBanner
              publishedCall={ownCalls.length > 0}
              watchlistCount={watchlistCount}
              journalThesisCount={journalThesisCount}
              followingCount={followingMembers.length}
              referralPrompt={referralPrompt}
            />
          </>
        ) : null}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="referral">
        {referralPrompt ? <ReferralOverviewStrip prompt={referralPrompt} /> : null}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="pro_strip">
        {proLocked ? (
          <ProMembershipStrip locked watchlistSymbols={watchlistItems.map((w) => w.symbol)} />
        ) : null}
      </OverviewPanelGate>

      {session.role === "admin" && communityPulse.count === 0 && latestPreviews.length === 0 ? (
        <AdminCommunityHint />
      ) : null}

      {session.role === "admin" ? (
        <p className="text-center text-xs text-[var(--pf-gray-400)]">
          <Link
            href="/admin?tab=analytics"
            className="font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            Admin analytics
          </Link>
        </p>
      ) : null}
    </>
  );
}
