"use client";

import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";
import { cn } from "@/lib/utils";

const STATUS_COPY = {
  live: { label: "Live", detail: "Workspace stream connected — badges update in near real time." },
  connecting: { label: "Connecting", detail: "Opening workspace activity stream…" },
  offline: { label: "Polling", detail: "Live stream offline — unread counts refresh on interval." },
  idle: { label: "Syncing", detail: "Workspace activity stream starting…" },
} as const;

export function WorkspaceStreamStatus({ className }: { className?: string }) {
  const activity = useWorkspaceActivityOptional();
  const status = activity?.streamStatus ?? "idle";
  const copy = STATUS_COPY[status] ?? STATUS_COPY.idle;

  const dotClass =
    status === "live"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-sky-500 animate-pulse"
        : status === "offline"
          ? "bg-amber-500"
          : "bg-[var(--pf-gray-400)]";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2",
        className
      )}
      title={copy.detail}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={cn("inline-flex h-2 w-2 rounded-full", dotClass)} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
          Workspace
        </p>
        <p className="truncate text-xs font-semibold text-[var(--pf-black)]">{copy.label}</p>
      </div>
    </div>
  );
}
