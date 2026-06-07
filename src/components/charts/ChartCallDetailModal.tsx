"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";

export function ChartCallDetailModal({
  call,
  onClose,
  interactive = false,
  viewerUserId,
  isPro,
  showUpgrade,
  canGenerateSummary,
  isAdmin,
}: {
  call: ChartCallPreview;
  onClose: () => void;
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
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`thesis-${call.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.classList.add("pf-thesis-highlight");
      window.setTimeout(() => el?.classList.remove("pf-thesis-highlight"), 2200);
    });
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
      <div className="flex max-h-[min(90dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] shadow-xl sm:rounded-[var(--pf-radius-lg)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--pf-border)] bg-white px-4 py-3">
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
        <div className="shrink-0 border-t border-[var(--pf-border)] bg-white px-4 py-3">
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
