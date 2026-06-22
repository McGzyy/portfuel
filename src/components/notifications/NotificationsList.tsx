"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { NotificationsCommandHeader } from "@/components/notifications/NotificationsCommandHeader";
import { NotificationsFilterBar } from "@/components/notifications/NotificationsFilterBar";
import { NotificationInboxItem } from "@/components/notifications/NotificationInboxItem";
import { Button } from "@/components/ui/button";
import { PanelErrorState } from "@/components/errors/PanelErrorState";
import {
  applyLocalNotificationRead,
  markNotificationsReadByIds,
} from "@/components/notifications/mark-notifications-read";
import {
  countByFilter,
  groupNotificationsByDate,
  matchesNotificationFilter,
  NOTIFICATION_FILTER_OPTIONS,
  type NotificationFilterKey,
  type SnoozeDuration,
} from "@/lib/notifications/inbox-filters";
import { WORKSPACE_ACTIVITY_EVENT } from "@/lib/workspace/activity-events";
import type { UserNotification } from "@/lib/notifications/types";

export function NotificationsList({ proUnlocked: _proUnlocked = false }: { proUnlocked?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilterKey>("all");
  const [snoozeDisabled, setSnoozeDisabled] = useState(false);
  const [demoSnoozedIds, setDemoSnoozedIds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onActivity = () => void load();
    window.addEventListener(WORKSPACE_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(WORKSPACE_ACTIVITY_EVENT, onActivity);
  }, [load]);

  const visibleItems = useMemo(() => {
    const base = items.filter((n) => !demoSnoozedIds.has(n.id));
    return base.filter((n) => matchesNotificationFilter(n, filter));
  }, [items, filter, demoSnoozedIds]);

  const filterCounts = useMemo(() => countByFilter(items), [items]);

  const grouped = useMemo(() => groupNotificationsByDate(visibleItems), [visibleItems]);

  const filterUnread = useMemo(
    () => visibleItems.filter((n) => !n.read_at).length,
    [visibleItems]
  );

  const activeFilterLabel =
    NOTIFICATION_FILTER_OPTIONS.find((o) => o.key === filter)?.label ?? "All";

  async function markAllRead() {
    const body =
      filter === "all"
        ? { all: true }
        : filter === "unread"
          ? { all: true }
          : { filter };

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const idsToMark =
      filter === "all" || filter === "unread"
        ? items.filter((n) => !n.read_at).map((n) => n.id)
        : visibleItems.filter((n) => !n.read_at).map((n) => n.id);

    setUnread((c) => Math.max(0, c - idsToMark.length));
    setItems((prev) => applyLocalNotificationRead(prev, idsToMark));
    window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  }

  async function openItem(n: UserNotification) {
    if (!n.read_at) {
      if (!n.id.startsWith("demo-")) {
        await markNotificationsReadByIds([n.id]);
      }
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => applyLocalNotificationRead(prev, [n.id]));
      window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
    }
    router.push(n.href);
  }

  async function snoozeItem(id: string, duration: SnoozeDuration) {
    if (id.startsWith("demo-")) {
      setDemoSnoozedIds((prev) => new Set(prev).add(id));
      if (!items.find((n) => n.id === id)?.read_at) {
        setUnread((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
      }
      return;
    }

    const res = await fetch("/api/notifications/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, duration }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "migration_required") setSnoozeDisabled(true);
      return;
    }

    const data = await res.json();
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnread(data.unreadCount ?? 0);
    window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  }

  return (
    <div className="space-y-5">
      <NotificationsCommandHeader
        unreadCount={unread}
        totalCount={items.length}
        action={
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/dashboard/settings?section=notifications"
              className="pf-chip-action gap-1.5 px-3 py-1.5 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              Alert settings
            </Link>
            {filterUnread > 0 ? (
              <Button size="sm" variant="secondary" onClick={markAllRead}>
                {filter === "all" ? "Mark all read" : `Mark ${activeFilterLabel.toLowerCase()} read`}
              </Button>
            ) : null}
          </div>
        }
      />

      {!loading && items.length > 0 ? (
        <NotificationsFilterBar active={filter} counts={filterCounts} onChange={setFilter} />
      ) : null}

      {snoozeDisabled ? (
        <p className="rounded-[var(--pf-radius)] border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Snooze requires a database migration — apply{" "}
          <code className="font-mono text-[11px]">20260710100000_notification_snooze.sql</code> in
          Supabase.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)]/50 px-4 py-3 sm:px-5">
        <p className="text-sm text-[var(--pf-gray-600)]">
          Filter by category, snooze noisy alerts, or tune delivery in settings.
        </p>
        <Link
          href="/dashboard/settings?section=notifications"
          className="shrink-0 text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Open alert settings →
        </Link>
      </div>

      {loadError ? (
        <PanelErrorState
          title="Alerts couldn\u2019t load"
          message="We couldn\u2019t fetch your notification inbox. Check your connection and try again."
          onRetry={() => void load()}
        />
      ) : loading ? (
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
      ) : visibleItems.length === 0 ? (
        <div className="pf-workspace-panel px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[var(--pf-black)]">No alerts in this filter</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--pf-gray-500)]">
            Try another category or mark items read to clear your inbox.
          </p>
          <Button size="sm" variant="secondary" className="mt-4" onClick={() => setFilter("all")}>
            Show all alerts
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((section) => (
            <section key={section.group} className="pf-workspace-panel overflow-hidden">
              <div className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 px-4 py-2.5 sm:px-5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pf-gray-500)]">
                  {section.label}
                  <span className="ml-2 font-semibold tabular-nums text-[var(--pf-gray-400)]">
                    {section.items.length}
                  </span>
                </h2>
              </div>
              <ul className="divide-y divide-[var(--pf-border)]">
                {section.items.map((n) => (
                  <NotificationInboxItem
                    key={n.id}
                    notification={n}
                    onOpen={openItem}
                    onSnooze={snoozeItem}
                    snoozeEnabled={!snoozeDisabled}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
