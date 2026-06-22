"use client";

import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { cn } from "@/lib/utils";

export function FueledDeskCallGrid({
  calls,
  viewerUserId,
  isAdmin = false,
  readOnly = false,
  quoteUpdatedAtBySymbol,
  isPro = false,
}: {
  calls: CallCardData[];
  viewerUserId?: string;
  isAdmin?: boolean;
  readOnly?: boolean;
  quoteUpdatedAtBySymbol?: Record<string, string>;
  isPro?: boolean;
}) {
  const display = calls.slice(0, 3);
  const featured = display.length === 1;

  return (
    <SparklineProvider symbols={display.map((c) => c.symbol)} lazy>
      <div
        className={cn(
          "mt-5 grid gap-4",
          featured
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]"
        )}
      >
        {display.map((call) => (
          <div
            key={call.id}
            className="min-w-0 [&_.group]:border-[var(--pf-border)] [&_.group]:bg-[var(--pf-surface)]"
          >
            <CallCard
              call={call}
              interactive={!readOnly}
              compact={!featured}
              showSummary={false}
              showSparkline
              viewerUserId={viewerUserId}
              isAdmin={isAdmin}
              isPro={isPro}
              quoteUpdatedAt={quoteUpdatedAtBySymbol?.[call.symbol.toUpperCase()] ?? null}
              showQuoteFreshness={!readOnly}
            />
          </div>
        ))}
      </div>
    </SparklineProvider>
  );
}
