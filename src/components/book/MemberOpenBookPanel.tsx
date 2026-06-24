"use client";

import Link from "next/link";
import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { Button } from "@/components/ui/button";
import type { MemberBookCallRow } from "@/lib/calls/member-book";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { useMergedCalls } from "@/components/market/LiveBookProvider";
import { COPY } from "@/lib/copy";

function toCard(
  c: MemberBookCallRow,
  userId: string,
  username: string,
  displayName: string | null,
  avatarUrl?: string | null
) {
  return mapUserCallRowToCard(c, { userId, username, displayName, avatarUrl });
}

function CallList({
  calls,
  viewerUserId,
  username,
  displayName,
  avatarUrl,
  isAdmin,
  isPro,
  proLocked,
  interactive = false,
  showSparkline = false,
  quoteUpdatedAtBySymbol,
  showQuoteFreshness = false,
}: {
  calls: CallCardData[];
  viewerUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isPro: boolean;
  proLocked: boolean;
  interactive?: boolean;
  showSparkline?: boolean;
  quoteUpdatedAtBySymbol?: Record<string, string>;
  showQuoteFreshness?: boolean;
}) {
  const content = (
    <div className="divide-y divide-[var(--pf-border)]">
      {calls.map((call) => (
        <div key={call.id} className="pf-panel-inset">
          <CallCard
            call={call}
            compact
            embedded
            interactive={interactive}
            showSparkline={showSparkline}
            showSummary={!proLocked}
            viewerUserId={viewerUserId}
            isAdmin={isAdmin}
            isPro={isPro}
            showUpgrade={proLocked}
            canGenerateSummary={!proLocked}
            quoteUpdatedAt={quoteUpdatedAtBySymbol?.[call.symbol.toUpperCase()] ?? null}
            showQuoteFreshness={showQuoteFreshness && interactive}
          />
        </div>
      ))}
    </div>
  );

  if (showSparkline) {
    return (
      <SparklineProvider symbols={calls.map((c) => c.symbol)}>
        {content}
      </SparklineProvider>
    );
  }

  return content;
}

export function MemberOpenBookPanel({
  openCalls,
  needsClose,
  recentWrapped,
  deskOpenCalls,
  viewerUserId,
  username,
  displayName,
  avatarUrl,
  isAdmin,
  isPro,
  proLocked,
  quoteUpdatedAtBySymbol,
}: {
  openCalls: MemberBookCallRow[];
  needsClose: MemberBookCallRow[];
  recentWrapped: MemberBookCallRow[];
  deskOpenCalls: MemberBookCallRow[];
  viewerUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isPro: boolean;
  proLocked: boolean;
  quoteUpdatedAtBySymbol?: Record<string, string>;
}) {
  const mapCards = (rows: MemberBookCallRow[]) =>
    rows.map((c) => toCard(c, viewerUserId, username, displayName, avatarUrl));

  const openCards = useMergedCalls(mapCards(openCalls));
  const needsCloseCards = useMergedCalls(mapCards(needsClose));
  const wrappedCards = mapCards(recentWrapped);
  const deskCards = useMergedCalls(mapCards(deskOpenCalls));

  const hasMember =
    openCards.length > 0 || needsCloseCards.length > 0 || wrappedCards.length > 0;
  const hasAny = hasMember || deskCards.length > 0;

  if (!hasAny) {
    return (
      <section className="pf-workspace-panel px-5 py-10 text-center">
        <p className="font-medium text-[var(--pf-gray-700)]">No open calls on your book</p>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          Publish a personal member call, or post as the Fueled desk — desk positions appear in
          the sections below and on the Desk page.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href={COPY.newCallHref}>
            <Button size="sm">{COPY.publishCallCta}</Button>
          </Link>
          <Link href="/dashboard/desk">
            <Button size="sm" variant="outline">
              Fueled desk
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {deskCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Fueled desk positions">
          <div className="pf-panel-inset-x flex flex-wrap items-end justify-between gap-3 border-b border-[var(--pf-border)] py-5">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
                Fueled desk positions
              </h2>
              <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
                House calls you published — tracked on the model portfolio, not your personal
                member book
              </p>
            </div>
            <Link
              href="/dashboard/desk"
              className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Full desk book →
            </Link>
          </div>
          <CallList
            calls={deskCards}
            viewerUserId={viewerUserId}
            username={username}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
            isPro={isPro}
            proLocked={proLocked}
            interactive
            showSparkline
            quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
            showQuoteFreshness
          />
        </section>
      ) : null}
      {needsCloseCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Target reached">
          <div className="pf-panel-inset-x border-b border-emerald-200/80 bg-emerald-50/60 py-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <h2 className="text-sm font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
              Target reached — lock your return
            </h2>
            <p className="mt-0.5 text-xs text-emerald-800/90 dark:text-emerald-200/90">
              Price hit your stated target. Close at market to finalize this call on your track
              record.
            </p>
          </div>
          <CallList
            calls={needsCloseCards}
            viewerUserId={viewerUserId}
            username={username}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
            isPro={isPro}
            proLocked={proLocked}
            interactive
            quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
            showQuoteFreshness
          />
        </section>
      ) : null}

      {openCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Open calls">
          <div className="pf-panel-inset-x border-b border-[var(--pf-border)] py-5">
            <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
              Live positions
            </h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              Active theses — still working toward target and within 120 days
            </p>
          </div>
          <CallList
            calls={openCards}
            viewerUserId={viewerUserId}
            username={username}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
            isPro={isPro}
            proLocked={proLocked}
            interactive
            showSparkline
            quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
            showQuoteFreshness
          />
        </section>
      ) : null}

      {wrappedCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Closed and archived">
          <div className="pf-panel-inset-x border-b border-[var(--pf-border)] py-5">
            <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
              Closed & archived
            </h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              Locked returns and older positions off your live book
            </p>
          </div>
          <div className="pf-panel-inset space-y-4">
            {wrappedCards.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                compact
                viewerUserId={viewerUserId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
