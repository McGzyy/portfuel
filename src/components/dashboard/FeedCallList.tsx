"use client";

import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { isCallNewSinceSeen } from "@/lib/feed/last-seen";

export function FeedCallList({
  calls,
  feedSeenAt,
  proLocked,
  viewerUserId,
  isAdmin = false,
}: {
  calls: CallCardData[];
  feedSeenAt: number;
  proLocked: boolean;
  viewerUserId?: string;
  isAdmin?: boolean;
}) {
  const symbols = calls.map((c) => c.symbol);

  return (
    <SparklineProvider symbols={symbols} lazy>
      <div className="space-y-4">
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            interactive
            isNew={isCallNewSinceSeen(call.called_at, feedSeenAt)}
            canGenerateSummary={!proLocked}
            showUpgrade={proLocked}
            showSparkline
            viewerUserId={viewerUserId}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </SparklineProvider>
  );
}
