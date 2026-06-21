"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CallReturnDisplay } from "@/components/calls/CallReturnDisplay";
import { LiveCallReturnDisplay } from "@/components/calls/LiveCallReturnDisplay";
import { CallTargetProgressBar } from "@/components/calls/CallTargetProgressBar";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import { SymbolSparkline } from "@/components/charts/SymbolSparkline";
import type { CallCardData } from "@/components/calls/CallCard";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function OpenCallOverviewRow({ call }: { call: CallCardData }) {
  const isPending = call.call_state === "pending_entry";
  const isClosed = Boolean(call.closed_at);
  const ReturnDisplay = !isClosed && !isPending ? LiveCallReturnDisplay : CallReturnDisplay;
  const progress =
    call.target_progress != null ? Math.min(100, Math.max(0, call.target_progress)) : null;
  const showProgress = progress != null && !isPending && !isClosed;

  return (
    <Link
      href={`/ticker/${call.symbol}`}
      className="group flex items-center gap-3 rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]/80"
      aria-label={`View ${call.symbol} — ${call.return_pct != null ? `${call.return_pct >= 0 ? "+" : ""}${call.return_pct.toFixed(2)}%` : "open call"}`}
    >
      <SymbolAvatar
        symbol={call.symbol}
        assetClass={"asset_class" in call ? call.asset_class : undefined}
        size="sm"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-tight text-[var(--pf-black)] group-hover:text-[var(--pf-red)]">
            {call.symbol}
          </span>
          <Badge variant={call.direction === "long" ? "long" : "short"} className="text-[10px]">
            {call.direction}
          </Badge>
          {isPending ? (
            <Badge
              variant="default"
              className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
            >
              Pending
            </Badge>
          ) : null}
          {isClosed ? (
            <Badge variant="default" className="border-slate-200 bg-slate-100 text-[10px] text-slate-700">
              Closed
            </Badge>
          ) : null}
        </div>
        {showProgress ? (
          <CallTargetProgressBar progress={progress} className="mt-2" size="slim" />
        ) : (
          <p className="mt-1 text-[11px] text-[var(--pf-gray-500)]">{timeAgo(call.called_at)}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <SymbolSparkline
          symbol={call.symbol}
          width={56}
          height={26}
          trendUp={call.return_pct != null ? call.return_pct >= 0 : null}
          className="opacity-90"
        />
        <ReturnDisplay
          returnPct={call.return_pct}
          peakReturnPct={call.peak_return_pct}
          closedAt={call.closed_at}
          callState={call.call_state}
          triggerEntryPrice={call.trigger_entry_price}
          size="default"
          className={cn("text-right")}
        />
      </div>
    </Link>
  );
}
