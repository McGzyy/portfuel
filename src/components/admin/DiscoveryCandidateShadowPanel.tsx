"use client";

import { useEffect, useState } from "react";
import { LineChart } from "lucide-react";
import type { DiscoveryShadowCallRow } from "@/lib/desk-discovery/shadow-calls";
import { cn, formatPct } from "@/lib/utils";

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const STATUS_LABEL: Record<DiscoveryShadowCallRow["status"], string> = {
  open: "Open",
  target_hit: "Target hit",
  stop_hit: "Stop hit",
  expired: "Expired",
  superseded: "Superseded",
};

export function DiscoveryCandidateShadowPanel({ candidateId }: { candidateId: string }) {
  const [shadow, setShadow] = useState<DiscoveryShadowCallRow | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/desk-discovery?shadowFor=${encodeURIComponent(candidateId)}`
        );
        const json = await res.json();
        if (!cancelled) setShadow(json.shadow ?? null);
      } catch {
        if (!cancelled) setShadow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (shadow === undefined) {
    return <p className="text-xs text-[var(--pf-gray-400)]">Loading paper position…</p>;
  }

  if (!shadow) {
    return (
      <p className="text-xs leading-relaxed text-[var(--pf-gray-500)]">
        No paper call yet — opens automatically when an AI draft is saved for this candidate.
      </p>
    );
  }

  const ret = shadow.returnPct;
  const retUp = (ret ?? 0) >= 0;
  const open = shadow.status === "open";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <LineChart
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            open ? "text-emerald-600" : "text-[var(--pf-gray-400)]"
          )}
          strokeWidth={2}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--pf-black)]">
            Paper {shadow.direction.toUpperCase()} · {STATUS_LABEL[shadow.status]}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--pf-gray-500)]">
            Opened {fmtWhen(shadow.triggeredAt)}
            {shadow.closedAt ? ` · closed ${fmtWhen(shadow.closedAt)}` : null}
          </p>
        </div>
        {ret != null ? (
          <span
            className={cn(
              "shrink-0 text-sm font-bold tabular-nums",
              retUp ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {formatPct(ret)}
          </span>
        ) : null}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-md border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2 py-1.5">
          <dt className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">Entry</dt>
          <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[var(--pf-black)]">
            {shadow.entryPrice != null ? `$${shadow.entryPrice.toFixed(2)}` : "—"}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2 py-1.5">
          <dt className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">Target</dt>
          <dd className="mt-0.5 font-mono font-semibold tabular-nums text-emerald-700">
            {shadow.targetPrice != null ? `$${shadow.targetPrice.toFixed(2)}` : "—"}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2 py-1.5">
          <dt className="font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">Stop</dt>
          <dd className="mt-0.5 font-mono font-semibold tabular-nums text-rose-700">
            {shadow.stopPrice != null ? `$${shadow.stopPrice.toFixed(2)}` : "—"}
          </dd>
        </div>
      </dl>

      {shadow.targetProgress != null && open ? (
        <p className="text-[10px] text-[var(--pf-gray-500)]">
          Target progress{" "}
          <span className="font-semibold tabular-nums text-[var(--pf-black)]">
            {shadow.targetProgress.toFixed(0)}%
          </span>
          {shadow.peakReturnPct != null && shadow.peakReturnPct > (ret ?? 0) ? (
            <>
              {" "}
              · peak{" "}
              <span className="font-semibold tabular-nums text-emerald-600">
                {formatPct(shadow.peakReturnPct)}
              </span>
            </>
          ) : null}
        </p>
      ) : null}

      {shadow.closeReason && !open ? (
        <p className="text-[10px] text-[var(--pf-gray-500)]">{shadow.closeReason}</p>
      ) : null}
    </div>
  );
}
