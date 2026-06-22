"use client";

import type { DiscoveryScoreLine } from "@/lib/desk-discovery/score-breakdown";
import { cn } from "@/lib/utils";

const SIGNAL_LABELS: Record<string, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
  community_heat: "Community",
  recent_filing: "Filing",
  "multi-signal bonus": "Multi-signal",
};

export function DiscoveryScoreTooltip({
  score,
  lines,
  className,
}: {
  score: number;
  lines: DiscoveryScoreLine[];
  className?: string;
}) {
  return (
    <span className={cn("group/score relative inline-flex", className)}>
      <span
        className="cursor-help font-semibold tabular-nums text-[var(--pf-red)] underline decoration-dotted decoration-[var(--pf-red)]/40 underline-offset-2"
        tabIndex={0}
        aria-describedby={`score-tip-${score}`}
      >
        {score}
      </span>
      <span
        id={`score-tip-${score}`}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 hidden min-w-[10rem] rounded-lg border border-[var(--pf-border)] bg-white px-2.5 py-2 text-left shadow-lg group-hover/score:block group-focus-within/score:block"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Score breakdown
        </p>
        <ul className="mt-1 space-y-0.5">
          {lines.map((line) => (
            <li
              key={line.label}
              className="flex items-center justify-between gap-3 text-xs text-[var(--pf-gray-600)]"
            >
              <span>{SIGNAL_LABELS[line.label] ?? line.label}</span>
              <span className="font-semibold tabular-nums text-[var(--pf-red)]">
                +{line.points}
              </span>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}
