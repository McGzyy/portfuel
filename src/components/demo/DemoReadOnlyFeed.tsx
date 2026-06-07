"use client";

import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { SparklineProvider } from "@/components/charts/SparklineProvider";

export function DemoReadOnlyFeed({ calls }: { calls: CallCardData[] }) {
  if (calls.length === 0) {
    return (
      <div className="pf-workspace-panel px-6 py-12 text-center text-sm text-[var(--pf-gray-500)]">
        No calls to preview yet — check back after the community publishes.
      </div>
    );
  }

  return (
    <SparklineProvider symbols={calls.map((c) => c.symbol)} lazy>
      <div className="space-y-4">
        {calls.map((call) => (
          <CallCard key={call.id} call={call} showSparkline showSummary />
        ))}
      </div>
    </SparklineProvider>
  );
}
