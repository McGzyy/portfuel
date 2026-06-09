"use client";

import { Map } from "lucide-react";
import { WORKSPACE_GUIDE_OPEN_EVENT } from "@/lib/onboarding/workspace-guide";
import { cn } from "@/lib/utils";

export function WorkspaceGuideTrigger({
  onOpen,
  className,
}: {
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        window.dispatchEvent(new Event(WORKSPACE_GUIDE_OPEN_EVENT));
      }}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:text-[var(--foreground)]",
        className
      )}
    >
      <Map className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      Map
    </button>
  );
}
