"use client";

import { PositionsHighlightCards } from "@/components/book/PositionsHighlightCards";
import { LiveQuoteStatusChip } from "@/components/market/LiveQuoteStatusChip";
import { useLiveBookSummary } from "@/components/market/LiveBookProvider";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import { formatPct } from "@/lib/utils";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  const valueClass =
    accent === "positive"
      ? "pf-return-up"
      : accent === "negative"
        ? "pf-return-down"
        : "text-[var(--pf-black)]";

  return (
    <div className="rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

export function MemberOpenBookLiveStats({
  initialSummary,
}: {
  initialSummary: MemberOpenBookSummary;
}) {
  const summary = useLiveBookSummary(initialSummary) ?? initialSummary;

  const avgAccent =
    summary.avgReturnPct == null
      ? undefined
      : summary.avgReturnPct >= 0
        ? ("positive" as const)
        : ("negative" as const);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LiveQuoteStatusChip />
      </div>
      <PositionsHighlightCards best={summary.best} worst={summary.worst} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open calls" value={String(summary.openCount)} />
        <Stat label="Symbols" value={String(summary.uniqueSymbols)} />
        <Stat
          label="Avg return"
          value={summary.avgReturnPct != null ? formatPct(summary.avgReturnPct) : "—"}
          accent={avgAccent}
        />
        <Stat label="Long / short" value={`${summary.longCount} / ${summary.shortCount}`} />
      </div>
    </div>
  );
}
