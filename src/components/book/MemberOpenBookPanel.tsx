"use client";

import Link from "next/link";
import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { Button } from "@/components/ui/button";
import type { MemberBookCallRow } from "@/lib/calls/member-book";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
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
}) {
  const content = (
    <div className="divide-y divide-[var(--pf-border)]">
      {calls.map((call) => (
        <div key={call.id} className="px-4 py-3 sm:px-5 sm:py-4">
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
  viewerUserId,
  username,
  displayName,
  avatarUrl,
  isAdmin,
  isPro,
  proLocked,
}: {
  openCalls: MemberBookCallRow[];
  needsClose: MemberBookCallRow[];
  recentWrapped: MemberBookCallRow[];
  viewerUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isPro: boolean;
  proLocked: boolean;
}) {
  const mapCards = (rows: MemberBookCallRow[]) =>
    rows.map((c) => toCard(c, viewerUserId, username, displayName, avatarUrl));

  const openCards = mapCards(openCalls);
  const needsCloseCards = mapCards(needsClose);
  const wrappedCards = mapCards(recentWrapped);

  const hasAny = openCards.length > 0 || needsCloseCards.length > 0 || wrappedCards.length > 0;

  if (!hasAny) {
    return (
      <section className="pf-workspace-panel px-5 py-10 text-center">
        <p className="font-medium text-[var(--pf-gray-700)]">No open calls on your book</p>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          Publish a thesis with entry, target, and stop — then close at market when your thesis
          plays out.
        </p>
        <Link href={COPY.newCallHref} className="mt-4 inline-block">
          <Button size="sm">{COPY.publishCallCta}</Button>
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {needsCloseCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Target reached">
          <div className="border-b border-emerald-200/80 bg-emerald-50/60 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
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
          />
        </section>
      ) : null}

      {openCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Open calls">
          <div className="border-b border-[var(--pf-border)] px-5 py-4">
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
          />
        </section>
      ) : null}

      {wrappedCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Closed and archived">
          <div className="border-b border-[var(--pf-border)] px-5 py-4">
            <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
              Closed & archived
            </h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              Locked returns and older positions off your live book
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
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
