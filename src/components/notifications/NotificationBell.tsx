"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Flame,
  MessageCircle,
  MessageSquare,
  Target,
  ThumbsUp,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { NotificationType, UserNotification } from "@/lib/notifications/types";

function iconForType(type: NotificationType) {
  switch (type) {
    case "watchlist_call":
      return TrendingUp;
    case "vote_on_call":
      return ThumbsUp;
    case "comment_on_call":
      return MessageSquare;
    case "followed_member_call":
      return UserPlus;
    case "desk_portfolio_update":
      return Flame;
    case "call_milestone":
      return Target;
    case "direct_message":
      return MessageCircle;
    default:
      return Bell;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  }

  async function openNotification(n: UserNotification) {
    if (!n.read_at && !n.id.startsWith("demo-")) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setUnread((c) => Math.max(0, c - 1));
      window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
        )
      );
    }
    setOpen(false);
    router.push(n.href);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white text-[var(--pf-gray-600)] shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-black)]"
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
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
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

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul>
                {items.slice(0, 12).map((n) => {
                  const Icon = iconForType(n.type);
                  const unreadItem = !n.read_at;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n)}
                        className={cn(
                          "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--pf-gray-50)]",
                          unreadItem && "bg-[var(--pf-red-muted)]/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            unreadItem
                              ? "bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
                              : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-500)]"
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[var(--pf-black)]">
                            {n.title}
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

          <div className="border-t border-[var(--pf-border)] px-4 py-2.5 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
