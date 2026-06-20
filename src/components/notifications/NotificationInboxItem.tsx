"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { UserNotification } from "@/lib/notifications/types";
import { iconForNotificationType } from "@/components/notifications/notification-icons";
import { SNOOZE_OPTIONS, type SnoozeDuration } from "@/lib/notifications/inbox-filters";

export function NotificationInboxItem({
  notification: n,
  onOpen,
  onSnooze,
  snoozeEnabled = true,
}: {
  notification: UserNotification;
  onOpen: (n: UserNotification) => void;
  onSnooze: (id: string, duration: SnoozeDuration) => void;
  snoozeEnabled?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = iconForNotificationType(n.type);
  const unreadItem = !n.read_at;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <li className="relative">
      <div
        className={cn(
          "group flex w-full gap-4 px-4 py-4 sm:px-5 sm:py-4",
          unreadItem
            ? "bg-[var(--pf-red-muted)]/50"
            : "bg-transparent hover:bg-[var(--pf-gray-50)]"
        )}
      >
        {unreadItem ? (
          <span
            className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-[var(--pf-red)]"
            aria-hidden
          />
        ) : null}
        <button
          type="button"
          onClick={() => onOpen(n)}
          className="flex min-w-0 flex-1 gap-4 text-left"
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              unreadItem
                ? "bg-white text-[var(--pf-red)] shadow-[var(--pf-shadow-sm)]"
                : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-500)] group-hover:bg-[var(--pf-gray-200)]"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  "font-semibold",
                  unreadItem ? "text-[var(--pf-black)]" : "text-[var(--pf-gray-800)]"
                )}
              >
                {n.title}
              </span>
              {unreadItem ? (
                <span className="rounded-full bg-[var(--pf-red)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  New
                </span>
              ) : null}
              <span className="text-xs text-[var(--pf-gray-400)]">{timeAgo(n.created_at)}</span>
            </span>
            <p
              className={cn(
                "mt-1 text-sm leading-relaxed",
                unreadItem ? "text-[var(--pf-gray-700)]" : "text-[var(--pf-gray-500)]"
              )}
            >
              {n.body}
            </p>
          </span>
        </button>

        {snoozeEnabled ? (
          <div className="relative shrink-0 self-start" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[var(--pf-gray-400)] transition-colors hover:border-[var(--pf-border)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-gray-700)]",
                menuOpen && "border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-700)]"
              )}
              aria-label="Snooze alert"
              aria-expanded={menuOpen}
            >
              <Clock className="h-4 w-4" strokeWidth={2.25} />
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-surface)] py-1 shadow-[var(--pf-shadow-md)]"
                role="menu"
              >
                {SNOOZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.duration}
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
                    onClick={() => {
                      setMenuOpen(false);
                      onSnooze(n.id, opt.duration);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
