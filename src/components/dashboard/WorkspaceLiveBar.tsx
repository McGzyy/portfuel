"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { cn, formatPct } from "@/lib/utils";
import { useProQuoteRefresh } from "@/hooks/useProQuoteRefresh";
import type { WorkspacePulse } from "@/lib/workspace/pulse";

const POLL_MS = 45_000;

export function WorkspaceLiveBar({
  initial,
  compact = false,
  previewMode = false,
  feedHref = "/dashboard/feed",
}: {
  initial?: WorkspacePulse | null;
  /** Overview: stats only — no scrolling tape. */
  compact?: boolean;
  /** Demo preview — static pulse, no API polling. */
  previewMode?: boolean;
  feedHref?: string;
}) {
  const router = useRouter();
  const [pulse, setPulse] = useState<WorkspacePulse | null>(initial ?? null);
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/pulse");
      if (res.ok) {
        const data = (await res.json()) as WorkspacePulse;
        setPulse(data);
        setTick((t) => t + 1);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    try {
      const url = pulse?.isPro ? "/api/pro/refresh-quotes" : "/api/calls/refresh-quotes";
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        await load();
        router.refresh();
      }
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  }, [load, pulse?.isPro, router]);

  useProQuoteRefresh({
    enabled: Boolean(pulse?.isPro),
    onRefresh: refreshPrices,
  });

  useEffect(() => {
    if (previewMode) return;
    if (!initial) void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [initial, load, previewMode]);

  if (!pulse) return null;

  const tape = pulse.tape.length > 0 ? [...pulse.tape, ...pulse.tape] : [];

  return (
    <div
      className={cn(
        "pf-live-bar overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] shadow-[var(--pf-shadow-sm)]",
        compact && "pf-live-bar-compact"
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-2.5",
          compact ? "bg-[var(--pf-surface)]" : "border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)]"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="pf-live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-[var(--pf-black)]">Live pulse</span>
          <span className="hidden text-xs text-[var(--pf-gray-500)] sm:inline">
            · {pulse.isPro ? "Pro quotes" : "Quotes"} every {pulse.quotesRefreshMinutes}m
            {pulse.isPro ? " · open book live ~45s" : " · open book ~2m"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--pf-gray-600)]">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-[var(--pf-gray-400)]" />
            <strong className="tabular-nums text-[var(--pf-black)]">
              {pulse.callsLast24h}
            </strong>{" "}
            calls (24h)
          </span>
          <button
            type="button"
            disabled={refreshing || previewMode}
            onClick={() => void refreshPrices()}
            className="font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] disabled:opacity-50"
          >
            {previewMode ? "Live in workspace" : refreshing ? "Updating…" : "Update prices"}
          </button>
          <Link
            href={feedHref}
            className="font-semibold text-[var(--pf-gray-700)] hover:text-[var(--pf-black)]"
          >
            Feed →
          </Link>
        </div>
      </div>

      {!compact && tape.length > 0 ? (
        <div className="relative h-9 overflow-hidden bg-[var(--pf-black)]" aria-hidden>
          <div
            key={tick}
            className="pf-ticker-tape flex h-full w-max items-center gap-8 px-4"
          >
            {tape.map((item, i) => (
              <Link
                key={`${item.symbol}-${i}`}
                href={`/ticker/${item.symbol}`}
                className="inline-flex shrink-0 items-center gap-2 font-mono text-xs font-semibold text-slate-200 hover:text-white"
                tabIndex={i < pulse.tape.length ? 0 : -1}
              >
                {item.label}
                {item.changePct != null ? (
                  <span
                    className={cn(
                      "tabular-nums",
                      item.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {formatPct(item.changePct)}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
