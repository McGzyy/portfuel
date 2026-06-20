"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveBookStatus, type LiveBookStatus } from "@/components/market/LiveBookProvider";

function formatAgeMs(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

function statusLabel(
  status: LiveBookStatus,
  ageMs: number | null,
  isPro: boolean,
  quoteErrors: string[]
): string {
  const partial =
    quoteErrors.length > 0 && status === "live"
      ? ` · ${quoteErrors.length} quote${quoteErrors.length === 1 ? "" : "s"} stale`
      : "";
  switch (status) {
    case "refreshing":
      return "Updating prices…";
    case "error":
      return "Quote sync failed";
    case "stale":
      return ageMs != null ? `Stale · ${formatAgeMs(ageMs)}` : "Stale quotes";
    case "live":
      return (
        (ageMs != null
          ? `${isPro ? "Live" : "Quotes"} · ${formatAgeMs(ageMs)}`
          : isPro
            ? "Live"
            : "Quotes") + partial
      );
    default:
      return "Syncing…";
  }
}

export function LiveQuoteStatusChip({
  className,
  showRefresh = true,
  compact = false,
}: {
  className?: string;
  showRefresh?: boolean;
  compact?: boolean;
}) {
  const { status, fetchedAt, isPro, refreshNow, openCount, quoteErrors } = useLiveBookStatus();
  const [ageMs, setAgeMs] = useState<number | null>(null);

  useEffect(() => {
    if (!fetchedAt) {
      setAgeMs(null);
      return;
    }
    const update = () => setAgeMs(Date.now() - new Date(fetchedAt).getTime());
    update();
    const id = setInterval(update, 5_000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  if (openCount === 0 && status === "idle") return null;

  const dotClass =
    status === "live"
      ? "bg-emerald-500"
      : status === "refreshing"
        ? "bg-sky-500"
        : status === "stale"
          ? "bg-amber-500"
          : status === "error"
            ? "bg-rose-500"
            : "bg-[var(--pf-gray-400)]";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pf-gray-600)]",
        compact && "px-2 py-0.5 text-[10px]",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {status === "live" ? (
          <span
            className={cn("pf-live-dot absolute inline-flex h-full w-full rounded-full opacity-75", dotClass)}
          />
        ) : null}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotClass)} />
      </span>
      <span>{statusLabel(status, ageMs, isPro, quoteErrors)}</span>
      {showRefresh && refreshNow ? (
        <button
          type="button"
          onClick={() => void refreshNow()}
          disabled={status === "refreshing"}
          className="inline-flex items-center gap-0.5 text-[var(--pf-gray-500)] hover:text-[var(--pf-black)] disabled:opacity-50"
          aria-label="Refresh prices now"
        >
          <RefreshCw
            className={cn("h-3 w-3", status === "refreshing" && "animate-spin")}
            strokeWidth={2.25}
          />
        </button>
      ) : null}
    </div>
  );
}
