"use client";

import Link from "next/link";
import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { Button } from "@/components/ui/button";
import { LiveQuoteStatusChip } from "@/components/market/LiveQuoteStatusChip";
import { useMergedCalls } from "@/components/market/LiveBookProvider";
import { COPY } from "@/lib/copy";

export function OpenCallsPanel({
  calls,
  viewerUserId,
  isAdmin,
  username,
  isPro,
  proLocked,
}: {
  calls: CallCardData[];
  viewerUserId?: string | null;
  isAdmin: boolean;
  username: string;
  isPro: boolean;
  proLocked: boolean;
}) {
  const liveCalls = useMergedCalls(calls);
  if (calls.length === 0) return null;

  const symbols = liveCalls.map((c) => c.symbol);

  return (
    <section className="pf-workspace-panel" aria-label="Your open calls">
      <div className="pf-panel-inset-x flex flex-col gap-2 border-b border-[var(--pf-border)] py-4 sm:flex-row sm:items-end sm:justify-between sm:py-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
              Your open calls
            </h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              Live return and progress — pending entries show trigger and expiry
            </p>
          </div>
          <LiveQuoteStatusChip compact showRefresh />
        </div>
        <Link
          href="/dashboard/book"
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Positions →
        </Link>
      </div>
      <SparklineProvider symbols={symbols}>
        <div className="divide-y divide-[var(--pf-border)]">
          {liveCalls.slice(0, 4).map((call) => (
            <div key={call.id} className="pf-panel-inset">
              <CallCard
                call={call}
                compact
                embedded
                interactive
                showSparkline
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
      </SparklineProvider>
      {calls.length > 4 ? (
        <div className="pf-panel-inset-x border-t border-[var(--pf-border)] py-4 text-center">
          <Link href="/dashboard/book">
            <Button variant="secondary" size="sm">
              View all positions ({calls.length})
            </Button>
          </Link>
        </div>
      ) : (
        <div className="pf-panel-inset-x border-t border-[var(--pf-border)] py-4">
          <Link href={COPY.newCallHref}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {COPY.publishCallCta}
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
