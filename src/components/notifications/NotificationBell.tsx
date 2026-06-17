"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { UserNotification } from "@/lib/notifications/types";
import { iconForNotificationType } from "@/components/notifications/notification-icons";
import {
  applyLocalNotificationRead,
  markNotificationsReadByIds,
} from "@/components/notifications/mark-notifications-read";
import { useNotificationReadOnView } from "@/components/notifications/useNotificationReadOnView";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const handleMarkReadOnView = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setItems((prev) => applyLocalNotificationRead(prev, ids));
    setUnread((c) => Math.max(0, c - ids.length));

    const serverCount = await markNotificationsReadByIds(ids);
    if (serverCount != null) setUnread(serverCount);
    else if (ids.every((id) => id.startsWith("demo-"))) {
      window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
    }
  }, []);

  useNotificationReadOnView({
    active: open && !loading,
    items: items.slice(0, 12),
    scrollRef,
    itemRefs,
    onMarkRead: handleMarkReadOnView,
  });

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnread(0);
    setItems((prev) => applyLocalNotificationRead(prev, prev.map((n) => n.id)));
    window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  }

  async function openNotification(n: UserNotification) {
    if (!n.read_at && !n.id.startsWith("demo-")) {
      await markNotificationsReadByIds([n.id]);
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => applyLocalNotificationRead(prev, [n.id]));
    } else if (!n.read_at) {
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => applyLocalNotificationRead(prev, [n.id]));
      window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
    }
    setOpen(false);
    router.push(n.href);
  }

  const visibleItems = items.slice(0, 12);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="pf-icon-btn relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--pf-radius)]"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-4 w-4" strokeWidth={2.25} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--pf-red)] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="pf-popover-panel absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] shadow-[var(--pf-shadow-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-4 py-3">
            <p className="text-sm font-bold text-[var(--pf-black)]">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div ref={scrollRef} className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--pf-border)]">
                {visibleItems.map((n) => {
                  const Icon = iconForNotificationType(n.type);
                  const unreadItem = !n.read_at;
                  return (
                    <li
                      key={n.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(n.id, el);
                        else itemRefs.current.delete(n.id);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openNotification(n)}
                        className={cn(
                          "relative flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--pf-gray-50)]",
                          unreadItem && "bg-[var(--pf-red-muted)]/70"
                        )}
                      >
                        {unreadItem ? (
                          <span
                            className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[var(--pf-red)]"
                            aria-hidden
                          />
                        ) : null}
                        <span
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            unreadItem
                              ? "bg-white text-[var(--pf-red)] shadow-[var(--pf-shadow-sm)]"
                              : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-500)]"
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="block flex-1 text-sm font-semibold text-[var(--pf-black)]">
                              {n.title}
                            </span>
                            {unreadItem ? (
                              <span className="shrink-0 rounded-full bg-[var(--pf-red)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                New
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
                            {n.body}
                          </span>
                          <span className="mt-1 block text-[10px] text-[var(--pf-gray-400)]">
                            {timeAgo(n.created_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-4 py-2.5 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              View all alerts
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
