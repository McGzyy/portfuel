"use client";

import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { CallPreviewRow, type CallPreviewData } from "@/components/dashboard/CallPreviewRow";

export function FeedPreviewList({
  previews,
  quoteUpdatedAtBySymbol,
  isPro,
}: {
  previews: CallPreviewData[];
  quoteUpdatedAtBySymbol?: Record<string, string>;
  isPro?: boolean;
}) {
  if (previews.length === 0) return null;

  return (
    <SparklineProvider symbols={previews.map((p) => p.symbol)}>
      <div className="divide-y divide-[var(--pf-border)]">
        {previews.map((call) => (
          <CallPreviewRow
            key={call.id}
            call={call}
            showSparkline
            quoteUpdatedAt={quoteUpdatedAtBySymbol?.[call.symbol.toUpperCase()] ?? null}
            isPro={isPro}
          />
        ))}
      </div>
    </SparklineProvider>
  );
}
