"use client";

import { cn } from "@/lib/utils";
import {
  NOTIFICATION_FILTER_OPTIONS,
  type NotificationFilterKey,
} from "@/lib/notifications/inbox-filters";

export function NotificationsFilterBar({
  active,
  counts,
  onChange,
}: {
  active: NotificationFilterKey;
  counts: Record<NotificationFilterKey, number>;
  onChange: (filter: NotificationFilterKey) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filter alerts"
    >
      {NOTIFICATION_FILTER_OPTIONS.map((opt) => {
        const count = counts[opt.key];
        const selected = active === opt.key;
        const showBadge = opt.key !== "all" && count > 0;

        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={selected}
            title={opt.description}
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              selected
                ? "border-[var(--pf-red)] bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
                : "border-[var(--pf-border)] bg-[var(--pf-surface)] text-[var(--pf-gray-600)] hover:border-[var(--pf-gray-300)] hover:text-[var(--pf-black)]"
            )}
          >
            {opt.label}
            {showBadge ? (
              <span
                className={cn(
                  "min-w-[1.125rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  selected
                    ? "bg-[var(--pf-red)] text-white"
                    : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
