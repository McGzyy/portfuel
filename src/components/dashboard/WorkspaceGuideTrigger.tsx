"use client";

import { Map } from "lucide-react";
import { WORKSPACE_GUIDE_OPEN_EVENT } from "@/lib/onboarding/workspace-guide";

export function WorkspaceGuideTrigger({ onOpen }: { onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        window.dispatchEvent(new Event(WORKSPACE_GUIDE_OPEN_EVENT));
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-black)]"
    >
      <Map className="h-3.5 w-3.5" />
      Map
    </button>
  );
}
