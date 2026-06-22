"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";

export function FeedNewBadge({
  initial = 0,
  className,
}: {
  initial?: number;
  className?: string;
}) {
  const activity = useWorkspaceActivityOptional();
  const [count, setCount] = useState(initial);

  useEffect(() => {
    setCount(initial);
  }, [initial]);

  useEffect(() => {
    if (activity?.feedNewCount != null) {
      setCount(activity.feedNewCount);
    }
  }, [activity?.feedNewCount]);

  useEffect(() => {
    const onFeed = (e: Event) => {
      const detail = (e as CustomEvent<{ feedNewCount?: number }>).detail;
      if (detail?.feedNewCount != null) setCount(detail.feedNewCount);
    };
    window.addEventListener("portfuel:feed-activity-changed", onFeed);
    return () => window.removeEventListener("portfuel:feed-activity-changed", onFeed);
  }, []);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
        className
      )}
      aria-label={`${count} new feed call${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
