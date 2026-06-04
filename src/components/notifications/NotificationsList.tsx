"use client";

import { useCallback, useEffect, useState } from "react";
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
import { NotificationsCommandHeader } from "@/components/notifications/NotificationsCommandHeader";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { Button } from "@/components/ui/button";
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

export function NotificationsList({ proUnlocked = false }: { proUnlocked?: boolean }) {
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
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  }

  async function openItem(n: UserNotification) {
    if (!n.read_at && !n.id.startsWith("demo-")) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setUnread((c) => Math.max(0, c - 1));
      window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
    } else if (!n.read_at) {
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      );
    }
    router.push(n.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <NotificationsCommandHeader unreadCount={unread} totalCount={items.length} />
        {unread > 0 ? (
          <Button size="sm" variant="secondary" onClick={markAllRead} className="shrink-0">
            Mark all read
          </Button>
        ) : null}
      </div>

      <WorkspaceQuickActions compact proUnlocked={proUnlocked} />

      {loading ? (
        <p className="text-sm text-[var(--pf-gray-500)]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="pf-workspace-panel px-6 py-14 text-center text-sm text-[var(--pf-gray-500)]">
          No notifications yet. Add symbols to your{" "}
          <Link href="/dashboard/watchlist" className="font-semibold text-[var(--pf-red)] hover:underline">
            watchlist
          </Link>{" "}
          and publish calls — engagement shows up here.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const Icon = iconForType(n.type);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn(
                    "pf-workspace-panel flex w-full gap-4 p-4 text-left transition-shadow hover:shadow-[var(--pf-shadow-md)]",
                    !n.read_at && "ring-1 ring-[var(--pf-red)]/20"
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-[var(--pf-black)]">{n.title}</span>
                    <p className="mt-1 text-sm text-[var(--pf-gray-600)]">{n.body}</p>
                    <p className="mt-2 text-xs text-[var(--pf-gray-400)]">{timeAgo(n.created_at)}</p>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
