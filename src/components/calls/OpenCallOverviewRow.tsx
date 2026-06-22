"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CallReturnDisplay } from "@/components/calls/CallReturnDisplay";
import { LiveCallReturnDisplay } from "@/components/calls/LiveCallReturnDisplay";
import { CallTargetProgressBar } from "@/components/calls/CallTargetProgressBar";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { useSparkline } from "@/components/charts/SparklineProvider";
import type { CallCardData } from "@/components/calls/CallCard";
import { buildOpenCallOverviewMeta } from "@/lib/calls/open-call-overview";
import { trimSparklineForCall } from "@/lib/charts/sparkline-call-window";
import { cn } from "@/lib/utils";

function OpenCallSparkline({ call }: { call: CallCardData }) {
  const raw = useSparkline(call.symbol);
  const points = useMemo(() => trimSparklineForCall(raw, call), [raw, call]);

  return (
    <MiniSparkline
      points={points}
      width={56}
      height={26}
      trendUp={call.return_pct != null ? call.return_pct >= 0 : null}
      className="opacity-90"
    />
  );
}

export function OpenCallOverviewRow({
  call,
  quoteUpdatedAt,
  isPro,
}: {
  call: CallCardData;
  quoteUpdatedAt?: string | null;
  isPro?: boolean;
}) {
  const isPending = call.call_state === "pending_entry";
  const isClosed = Boolean(call.closed_at);
  const ReturnDisplay = !isClosed && !isPending ? LiveCallReturnDisplay : CallReturnDisplay;
  const progress =
    call.target_progress != null ? Math.min(100, Math.max(0, call.target_progress)) : null;
  const showProgress = progress != null && !isPending && !isClosed;
  const meta = buildOpenCallOverviewMeta(call, { quoteUpdatedAt, isPro });

  return (
    <Link
      href={`/ticker/${call.symbol}`}
      className="group flex items-center gap-3 rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-3.5 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]/80"
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
          {call.is_fueled ? (
            <Badge variant="fueled" className="text-[10px]">
              Fueled
            </Badge>
          ) : null}
          {call.from_discovery ? (
            <Badge variant="discovery" className="text-[10px]">
              Discovery
            </Badge>
          ) : null}
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
        ) : null}
        <p className="mt-1.5 text-[11px] leading-snug text-[var(--pf-gray-500)]">{meta}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <OpenCallSparkline call={call} />
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
