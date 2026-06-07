"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";
import { cn, formatPct } from "@/lib/utils";

export function ChartCallDayPickerModal({
  callIds,
  callPreviewsById,
  focusCallId,
  onSelect,
  onClose,
}: {
  callIds: string[];
  callPreviewsById: Record<string, ChartCallPreview>;
  focusCallId?: string | null;
  onSelect: (callId: string) => void;
  onClose: () => void;
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

  const rows = callIds
    .map((id) => callPreviewsById[id])
    .filter((c): c is ChartCallPreview => Boolean(c));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--pf-black)]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chart-call-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(80dvh,28rem)] w-full max-w-md flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--pf-border)] bg-white shadow-xl sm:rounded-[var(--pf-radius-lg)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
          <div>
            <p id="chart-call-picker-title" className="text-sm font-bold text-[var(--pf-black)]">
              {rows.length} calls this day
            </p>
            <p className="text-xs text-[var(--pf-gray-500)]">Choose which thesis to open</p>
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
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {rows.map((call) => {
            const name = call.users.display_name ?? call.users.pin;
            const ret = call.return_pct;
            const retClass =
              ret == null
                ? "text-[var(--pf-gray-500)]"
                : ret >= 0
                  ? "text-emerald-600"
                  : "text-rose-600";
            const focused = call.id === focusCallId;

            return (
              <li key={call.id}>
                <button
                  type="button"
                  onClick={() => onSelect(call.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    focused
                      ? "border-[var(--pf-red)]/40 bg-[var(--pf-red)]/5"
                      : "border-transparent hover:border-[var(--pf-border)] hover:bg-[var(--pf-gray-50)]"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-[var(--pf-black)]">{name}</span>
                    <Badge variant={call.direction === "long" ? "long" : "short"} className="text-[10px]">
                      {call.direction}
                    </Badge>
                    {call.is_fueled ? (
                      <Badge variant="fueled" className="text-[10px]">
                        Fueled
                      </Badge>
                    ) : null}
                    <span className={cn("ml-auto text-xs font-bold tabular-nums", retClass)}>
                      {formatPct(ret)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--pf-gray-600)]">
                    {call.thesis}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
