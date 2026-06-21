"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export type DiscoveryToastState = {
  message: string;
  undo?: () => void;
} | null;

export function DiscoveryActionToast({
  toast,
  onDismiss,
}: {
  toast: DiscoveryToastState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDismiss, toast.undo ? 8000 : 4000);
    return () => window.clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--pf-border)]",
        "bg-[var(--pf-black)] px-4 py-2.5 text-sm text-white shadow-lg"
      )}
      role="status"
    >
      <span>{toast.message}</span>
      {toast.undo ? (
        <button
          type="button"
          onClick={() => {
            toast.undo?.();
            onDismiss();
          }}
          className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/10"
        >
          Undo
        </button>
      ) : null}
    </div>
  );
}
