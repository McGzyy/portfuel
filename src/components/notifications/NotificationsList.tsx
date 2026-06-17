"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { NotificationsCommandHeader } from "@/components/notifications/NotificationsCommandHeader";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import type { UserNotification } from "@/lib/notifications/types";
import { iconForNotificationType } from "@/components/notifications/notification-icons";
import {
  applyLocalNotificationRead,
  markNotificationsReadByIds,
} from "@/components/notifications/mark-notifications-read";

export function NotificationsList({ proUnlocked: _proUnlocked = false }: { proUnlocked?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  async function openItem(n: UserNotification) {
    if (!n.read_at) {
      if (!n.id.startsWith("demo-")) {
        await markNotificationsReadByIds([n.id]);
      }
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => applyLocalNotificationRead(prev, [n.id]));
      if (n.id.startsWith("demo-")) {
        window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
      }
    }
    router.push(n.href);
  }

  return (
    <div className="space-y-5">
      <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <NotificationsCommandHeader unreadCount={unread} totalCount={items.length} embedded />
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">
            <Link
              href="/dashboard/settings?section=notifications"
              className="pf-chip-action gap-1.5 px-3 py-1.5 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              Alert settings
            </Link>
            {unread > 0 ? (
              <Button size="sm" variant="secondary" onClick={markAllRead}>
                Mark all read
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)]/50 px-4 py-3 sm:px-5">
        <p className="text-sm text-[var(--pf-gray-600)]">
          Configure watchlist moves, earnings reminders, email, and Pro SMS delivery.
        </p>
        <Link
          href="/dashboard/settings?section=notifications"
          className="shrink-0 text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Open alert settings →
        </Link>
      </div>

      {loading ? (
        <div className="pf-workspace-panel px-6 py-12 text-center text-sm text-[var(--pf-gray-500)]">
          Loading alerts…
        </div>
      ) : items.length === 0 ? (
        <div className="pf-workspace-panel px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[var(--pf-black)]">No alerts yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--pf-gray-500)]">
            Add symbols to your{" "}
            <Link href="/dashboard/watchlist" className="font-semibold text-[var(--pf-red)] hover:underline">
              watchlist
            </Link>{" "}
            and publish calls — engagement shows up here.
          </p>
        </div>
      ) : (
        <div className="pf-workspace-panel overflow-hidden">
          <ul className="divide-y divide-[var(--pf-border)]">
            {items.map((n) => {
              const Icon = iconForNotificationType(n.type);
              const unreadItem = !n.read_at;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={cn(
                      "group relative flex w-full gap-4 px-4 py-4 text-left transition-colors sm:px-5 sm:py-4",
                      unreadItem
                        ? "bg-[var(--pf-red-muted)]/50 hover:bg-[var(--pf-red-muted)]/70"
                        : "hover:bg-[var(--pf-gray-50)]"
                    )}
                  >
                    {unreadItem ? (
                      <span
                        className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-[var(--pf-red)]"
                        aria-hidden
                      />
                    ) : null}
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
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
