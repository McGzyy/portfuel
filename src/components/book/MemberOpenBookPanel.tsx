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
  displayName: string | null
) {
  return mapUserCallRowToCard(c, { userId, username, displayName });
}

export function MemberOpenBookPanel({
  openCalls,
  recentClosed,
  viewerUserId,
  username,
  displayName,
  isAdmin,
  isPro,
  proLocked,
}: {
  openCalls: MemberBookCallRow[];
  recentClosed: MemberBookCallRow[];
  viewerUserId: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  isPro: boolean;
  proLocked: boolean;
}) {
  const cards = openCalls.map((c) => toCard(c, viewerUserId, username, displayName));
  const closedCards = recentClosed.map((c) => toCard(c, viewerUserId, username, displayName));
  const symbols = cards.map((c) => c.symbol);

  if (cards.length === 0) {
    return (
      <section className="pf-workspace-panel px-5 py-10 text-center">
        <p className="font-medium text-[var(--pf-gray-700)]">No open calls on your book</p>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          Publish a thesis with entry, target, and stop — or close out older positions on your
          profile.
        </p>
        <Link href={COPY.newCallHref} className="mt-4 inline-block">
          <Button size="sm">{COPY.publishCallCta}</Button>
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="pf-workspace-panel overflow-hidden" aria-label="Open calls">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">Live positions</h2>
          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
            Active theses — target not reached and within 120 days
          </p>
        </div>
        <SparklineProvider symbols={symbols}>
          <div className="space-y-4 p-4 sm:p-5">
            {cards.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                compact
                interactive
                showSparkline
                viewerUserId={viewerUserId}
                isAdmin={isAdmin}
                isPro={isPro}
                showUpgrade={proLocked}
                canGenerateSummary={!proLocked}
              />
            ))}
          </div>
        </SparklineProvider>
      </section>

      {closedCards.length > 0 ? (
        <section className="pf-workspace-panel overflow-hidden" aria-label="Recently closed">
          <div className="border-b border-[var(--pf-border)] px-5 py-4">
            <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
              Recently closed
            </h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              Target hit or aged off your open book
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            {closedCards.map((call) => (
              <CallCard key={call.id} call={call} compact viewerUserId={viewerUserId} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
