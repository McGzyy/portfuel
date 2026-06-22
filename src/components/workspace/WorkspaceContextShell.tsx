"use client";

import { useEffect, useState } from "react";
import { Activity, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspaceContextShell({
  children,
  rail,
  mainClassName,
  pulseLabel = "Pulse",
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
  mainClassName?: string;
  pulseLabel?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  if (!rail) {
    return <div className={mainClassName}>{children}</div>;
  }

  return (
    <>
      <div className="pf-workspace-context-shell">
        <div className={cn("pf-workspace-context-main min-w-0", mainClassName)}>{children}</div>
        <div className="hidden lg:contents">{rail}</div>
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="pf-context-rail-fab hidden max-lg:inline-flex"
        aria-label={`Open ${pulseLabel}`}
      >
        <Activity className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>{pulseLabel}</span>
      </button>

      {sheetOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[65] bg-black/40 lg:hidden"
            aria-label="Close pulse panel"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="pf-context-rail-sheet lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={pulseLabel}
          >
            <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--pf-black)]">{pulseLabel}</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
            <div className="max-h-[min(70dvh,32rem)] overflow-y-auto overscroll-contain p-3">
              <div className="pf-context-rail-sheet-body">{rail}</div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
