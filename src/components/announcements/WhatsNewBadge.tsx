"use client";

import { cn } from "@/lib/utils";

export function WhatsNewBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--pf-red)] px-1 text-[10px] font-bold leading-none text-white",
        className
      )}
      aria-label={`${count} unread update${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
