"use client";

import { useEffect } from "react";
import {
  clearThesisHash,
  scrollToThesisBlock,
} from "@/lib/charts/thesis-hash";
import { X } from "lucide-react";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";
import { cn, formatPct } from "@/lib/utils";

export function ChartCallDetailModal({
  call,
  onClose,
  sameDayCallIds = [],
  callPreviewsById,
  onSelectCall,
  interactive = false,
  viewerUserId,
  isPro,
  showUpgrade,
  canGenerateSummary,
  isAdmin,
}: {
  call: ChartCallPreview;
  onClose: () => void;
  sameDayCallIds?: string[];
  callPreviewsById?: Record<string, ChartCallPreview>;
  onSelectCall?: (callId: string) => void;
  interactive?: boolean;
  viewerUserId?: string | null;
  isPro?: boolean;
  showUpgrade?: boolean;
  canGenerateSummary?: boolean;
  isAdmin?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function scrollToThread() {
    onClose();
    clearThesisHash();
    window.requestAnimationFrame(() => scrollToThesisBlock(call.id));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--pf-black)]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chart-call-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pf-chart-modal-shell flex max-h-[min(90dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--pf-border)] shadow-xl sm:rounded-[var(--pf-radius-lg)]">
        <div className="pf-chart-modal-bar flex shrink-0 items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
          <div>
            <p
              id="chart-call-modal-title"
              className="text-sm font-bold text-[var(--pf-black)]"
            >
              Community call
            </p>
            <p className="text-xs text-[var(--pf-gray-500)]">
              {call.symbol ?? "Ticker"} · stay on chart
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {sameDayCallIds.length > 1 && onSelectCall ? (
          <ChartCallSiblingStrip
            activeCall={call}
            sameDayCallIds={sameDayCallIds}
            callPreviewsById={callPreviewsById}
            onSelectCall={onSelectCall}
          />
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <CallThesisBlock
            call={call}
            interactive={interactive}
            viewerUserId={viewerUserId}
            isPro={isPro}
            showUpgrade={showUpgrade}
            canGenerateSummary={canGenerateSummary}
            isAdmin={isAdmin}
          />
        </div>
        <div className="pf-chart-modal-bar shrink-0 border-t border-[var(--pf-border)] px-4 py-3">
          <button
            type="button"
            onClick={scrollToThread}
            className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
          >
            View in community section ↓
          </button>
        </div>
      </div>
    </div>
  );
}

function ChartCallSiblingStrip({
  activeCall,
  sameDayCallIds,
  callPreviewsById,
  onSelectCall,
}: {
  activeCall: ChartCallPreview;
  sameDayCallIds: string[];
  callPreviewsById?: Record<string, ChartCallPreview>;
  onSelectCall: (callId: string) => void;
}) {
  return (
    <div className="shrink-0 border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Same day ({sameDayCallIds.length})
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {sameDayCallIds.map((id) => {
          const preview = callPreviewsById?.[id];
          const active = id === activeCall.id;
          const name = preview?.users.display_name ?? preview?.users.pin ?? "Call";
          const ret = preview?.return_pct;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectCall(id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? "pf-pill-active border"
                  : "pf-pill-inactive border hover:border-[var(--pf-gray-300)]"
              )}
            >
              {name}
              {ret != null ? (
                <span
                  className={cn(
                    "ml-1 tabular-nums",
                    active
                      ? "opacity-80"
                      : ret != null && ret >= 0
                        ? "pf-return-up"
                        : ret != null
                          ? "pf-return-down"
                          : "text-[var(--pf-gray-400)]"
                  )}
                >
                  {formatPct(ret)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
