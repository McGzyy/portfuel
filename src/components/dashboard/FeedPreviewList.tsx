"use client";

import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { CallPreviewRow, type CallPreviewData } from "@/components/dashboard/CallPreviewRow";

export function FeedPreviewList({ previews }: { previews: CallPreviewData[] }) {
  if (previews.length === 0) return null;

  return (
    <SparklineProvider symbols={previews.map((p) => p.symbol)}>
      <div className="divide-y divide-[var(--pf-border)]">
        {previews.map((call) => (
          <CallPreviewRow key={call.id} call={call} showSparkline />
        ))}
      </div>
    </SparklineProvider>
  );
}
