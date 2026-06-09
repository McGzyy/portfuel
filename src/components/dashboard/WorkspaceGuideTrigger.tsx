"use client";

import { Map } from "lucide-react";
import { WORKSPACE_GUIDE_OPEN_EVENT } from "@/lib/onboarding/workspace-guide";
import { cn } from "@/lib/utils";

export function WorkspaceGuideTrigger({
  onOpen,
  className,
  iconClassName,
  label = "Workspace map",
}: {
  onOpen?: () => void;
  className?: string;
  iconClassName?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        window.dispatchEvent(new Event(WORKSPACE_GUIDE_OPEN_EVENT));
      }}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-black)]",
        className
      )}
    >
      <Map
        className={cn("h-3.5 w-3.5 shrink-0", iconClassName)}
        strokeWidth={2.25}
      />
      {label}
    </button>
  );
}
