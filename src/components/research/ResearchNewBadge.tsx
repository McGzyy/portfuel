"use client";

import { useEffect, useState } from "react";
import type { WorkspaceActivitySnapshot } from "@/lib/workspace/activity-events";
import { WORKSPACE_ACTIVITY_EVENT } from "@/lib/workspace/activity-events";
import { cn } from "@/lib/utils";

export function ResearchNewBadge({
  initial,
  className,
}: {
  initial: number;
  className?: string;
}) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    setCount(initial);
  }, [initial]);

  useEffect(() => {
    const onActivity = (e: Event) => {
      const detail = (e as CustomEvent<WorkspaceActivitySnapshot>).detail;
      if (detail?.researchNewCount != null) setCount(detail.researchNewCount);
    };
    window.addEventListener(WORKSPACE_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(WORKSPACE_ACTIVITY_EVENT, onActivity);
  }, []);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--pf-red)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
        className
      )}
      aria-label={`${count} new research updates`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
