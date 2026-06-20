"use client";

import { useEquityMarketSession } from "@/components/market/useEquityMarketSession";
import { cn } from "@/lib/utils";
import type { AssetClass } from "@/lib/market/validate-symbol";

const SESSION_STYLES = {
  pre: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
  regular:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  after:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200",
  closed:
    "border-[var(--pf-border)] bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)] dark:bg-[var(--pf-gray-900)] dark:text-[var(--pf-gray-400)]",
} as const;

const DOT_STYLES = {
  pre: "bg-sky-500",
  regular: "bg-emerald-500",
  after: "bg-violet-500",
  closed: "bg-[var(--pf-gray-400)]",
} as const;

export function MarketSessionBadge({
  assetClass = "equity",
  variant = "badge",
  className,
  title,
}: {
  assetClass?: AssetClass | null;
  variant?: "badge" | "inline" | "dot";
  className?: string;
  title?: string;
}) {
  const session = useEquityMarketSession();

  if (assetClass === "crypto") return null;

  const label = variant === "inline" ? session.label : session.shortLabel;
  const tooltip = title ?? session.detail;

  if (variant === "dot") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide", className)}
        title={tooltip}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[session.session])} aria-hidden />
        {label}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("text-xs text-[var(--pf-gray-500)]", className)} title={tooltip}>
        {label}
        {session.isEarlyClose && session.session !== "closed" ? " · early close" : null}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        SESSION_STYLES[session.session],
        className
      )}
      title={tooltip}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[session.session])} aria-hidden />
      {label}
    </span>
  );
}
