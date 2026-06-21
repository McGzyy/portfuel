"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Keyboard, Radar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DiscoveryWorkflowStepper,
  type StepId,
} from "@/components/admin/DiscoveryWorkflowStepper";
import { DiscoveryScoreTooltip } from "@/components/admin/DiscoveryScoreTooltip";
import { buildScoreBreakdown } from "@/lib/desk-discovery/score-breakdown";
import { earningsLabel } from "@/lib/desk-discovery/candidate-sort";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import type { DiscoveryCandidateRow, DiscoveryScanSummary } from "@/lib/desk-discovery/types";
import type { DiscoveryPanelFilter } from "@/lib/admin/discovery-panel-url";
import { cn, formatPct } from "@/lib/utils";

const SIGNAL_LABELS: Record<string, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
};

function fmtScanWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function RailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pf-workspace-panel overflow-hidden", className)}>
      <p className="border-b border-[var(--pf-border)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
        {title}
      </p>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--pf-gray-600)]">
      {children}
    </kbd>
  );
}

export function DiscoveryContextRail({
  filter,
  activeStep,
  pendingCount,
  readyCount,
  lastScan,
  scanning,
  onRunScan,
  focusedRow,
  queueMode,
  onQueue,
  onPublish,
  onReject,
  onSnooze,
  className,
}: {
  filter: DiscoveryPanelFilter;
  activeStep: StepId;
  pendingCount: number;
  readyCount: number;
  lastScan: DiscoveryScanSummary | null;
  scanning: boolean;
  onRunScan: () => void;
  focusedRow: DiscoveryCandidateRow | null;
  queueMode: boolean;
  onQueue?: () => void;
  onPublish?: () => void;
  onReject?: () => void;
  onSnooze?: () => void;
  className?: string;
}) {
  const [quote, setQuote] = useState<{
    lastPrice: number;
    changePct: number | null;
  } | null>(null);

  useEffect(() => {
    if (!focusedRow) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/symbols/validate?symbol=${encodeURIComponent(focusedRow.symbol)}&assetClass=${focusedRow.assetClass}`
        );
        const data = await res.json();
        if (cancelled || !data.ok) return;
        setQuote({
          lastPrice: data.lastPrice as number,
          changePct: typeof data.changePct === "number" ? data.changePct : null,
        });
      } catch {
        if (!cancelled) setQuote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [focusedRow?.id, focusedRow?.symbol, focusedRow?.assetClass]);

  const scoreLines = focusedRow ? buildScoreBreakdown(focusedRow.signalTypes) : [];
  const earnings = focusedRow ? earningsLabel(focusedRow.reasons) : null;
  const isHighScore =
    focusedRow != null && focusedRow.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold;

  return (
    <aside className={cn("pf-discovery-rail-host", className)}>
      <div className="flex flex-col gap-3 pb-4">
        <RailSection title="Pipeline">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Inbox
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xl font-bold tabular-nums",
                  pendingCount > 0 ? "text-[var(--pf-red)]" : "text-[var(--pf-black)]"
                )}
              >
                {pendingCount}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Ready
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--pf-black)]">
                {readyCount}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <DiscoveryWorkflowStepper
              activeStep={activeStep}
              counts={{ inbox: pendingCount, ready: readyCount }}
            />
          </div>
        </RailSection>

        {focusedRow && queueMode ? (
          <RailSection title="Selected">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-[var(--pf-black)]">{focusedRow.symbol}</span>
              <DiscoveryScoreTooltip score={focusedRow.score} lines={scoreLines} />
              {isHighScore && filter === "inbox" ? (
                <Badge className="bg-amber-100 text-amber-800">High</Badge>
              ) : null}
            </div>
            {quote ? (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-sm font-bold tabular-nums text-[var(--pf-black)]">
                  ${quote.lastPrice.toFixed(2)}
                </span>
                {quote.changePct != null ? (
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      quote.changePct >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {formatPct(quote.changePct)}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--pf-gray-400)]">Loading quote…</p>
            )}
            {earnings ? (
              <p className="mt-2 text-xs font-medium text-amber-800">{earnings}</p>
            ) : null}
            <p className="mt-2 line-clamp-2 text-xs text-[var(--pf-gray-600)]">
              {focusedRow.headline ?? focusedRow.reasons[0]?.detail ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {focusedRow.signalTypes.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded border border-[var(--pf-border)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]"
                >
                  {SIGNAL_LABELS[t] ?? t}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {filter === "inbox" && onQueue ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
                  onClick={onQueue}
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.25} />
                  Queue to publish
                </Button>
              ) : null}
              {filter === "ready" && onPublish ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
                  onClick={onPublish}
                >
                  Publish Fueled call
                </Button>
              ) : null}
              {onSnooze ? (
                <Button type="button" size="sm" variant="outline" className="w-full" onClick={onSnooze}>
                  Snooze 7 days
                </Button>
              ) : null}
              {onReject ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-rose-600 hover:text-rose-700"
                  onClick={onReject}
                >
                  Reject
                </Button>
              ) : null}
              <Link
                href={`/ticker/${focusedRow.symbol}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
              >
                Open {focusedRow.symbol} chart
                <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
              </Link>
            </div>
          </RailSection>
        ) : queueMode ? (
          <RailSection title="Selected">
            <p className="text-sm text-[var(--pf-gray-500)]">
              Select a symbol from the queue to preview quote, signals, and quick actions.
            </p>
          </RailSection>
        ) : null}

        <RailSection title="Scanner">
          <div className="flex items-start gap-2">
            <Radar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--pf-black)]">
                {lastScan ? `${lastScan.hitsFound} hits · ${lastScan.upserted} saved` : "No scan yet"}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--pf-gray-500)]">
                {lastScan ? fmtScanWhen(lastScan.scannedAt) : "Run a scan to populate Inbox"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            disabled={scanning}
            onClick={onRunScan}
          >
            {scanning ? "Scanning…" : "Run scan"}
          </Button>
        </RailSection>

        {queueMode ? (
          <RailSection title="Shortcuts">
            <div className="flex items-center gap-2 text-[var(--pf-gray-400)]">
              <Keyboard className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">Keyboard</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-[var(--pf-gray-600)]">
              <li className="flex items-center justify-between gap-2">
                <span>Navigate</span>
                <span className="flex gap-1">
                  <Kbd>j</Kbd>
                  <Kbd>k</Kbd>
                </span>
              </li>
              {filter === "inbox" ? (
                <li className="flex items-center justify-between gap-2">
                  <span>Queue</span>
                  <Kbd>a</Kbd>
                </li>
              ) : filter === "ready" ? (
                <li className="flex items-center justify-between gap-2">
                  <span>Publish</span>
                  <Kbd>p</Kbd>
                </li>
              ) : null}
              <li className="flex items-center justify-between gap-2">
                <span>Reject</span>
                <Kbd>x</Kbd>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Snooze</span>
                <Kbd>s</Kbd>
              </li>
            </ul>
          </RailSection>
        ) : null}
      </div>
    </aside>
  );
}
