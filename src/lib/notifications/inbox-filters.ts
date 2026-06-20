import type { NotificationType } from "@/lib/notifications/types";

export type NotificationFilterKey =
  | "all"
  | "unread"
  | "watchlist"
  | "social"
  | "desk"
  | "support"
  | "billing";

export type NotificationDateGroup = "today" | "yesterday" | "this_week" | "earlier";

export const NOTIFICATION_FILTER_OPTIONS: {
  key: NotificationFilterKey;
  label: string;
  description: string;
}[] = [
  { key: "all", label: "All", description: "Every alert" },
  { key: "unread", label: "Unread", description: "Not yet opened" },
  { key: "watchlist", label: "Watchlist", description: "Price, earnings, journal levels" },
  { key: "social", label: "Social", description: "Votes, comments, follows, DMs" },
  { key: "desk", label: "Desk", description: "Fueled portfolio updates" },
  { key: "support", label: "Support", description: "Tickets and replies" },
  { key: "billing", label: "Billing", description: "Payment and subscription" },
];

const WATCHLIST_TYPES = new Set<NotificationType>([
  "watchlist_call",
  "watchlist_price_move",
  "watchlist_earnings",
  "watchlist_plan_level",
]);

const SOCIAL_TYPES = new Set<NotificationType>([
  "comment_on_call",
  "vote_on_call",
  "new_follower",
  "followed_member_call",
  "call_milestone",
  "direct_message",
]);

const SUPPORT_TYPES = new Set<NotificationType>([
  "support_ticket_opened",
  "support_ticket_reply",
  "support_ticket_idle_warning",
  "support_ticket_status",
  "admin_support_ticket",
]);

export function notificationFilterBucket(type: NotificationType): NotificationFilterKey {
  if (WATCHLIST_TYPES.has(type)) return "watchlist";
  if (SOCIAL_TYPES.has(type)) return "social";
  if (type === "desk_portfolio_update") return "desk";
  if (SUPPORT_TYPES.has(type)) return "support";
  if (type === "billing_payment_failed") return "billing";
  return "all";
}

export function typesForFilter(filter: NotificationFilterKey): NotificationType[] | null {
  if (filter === "all" || filter === "unread") return null;
  if (filter === "watchlist") return [...WATCHLIST_TYPES];
  if (filter === "social") return [...SOCIAL_TYPES];
  if (filter === "desk") return ["desk_portfolio_update"];
  if (filter === "support") return [...SUPPORT_TYPES];
  if (filter === "billing") return ["billing_payment_failed"];
  return null;
}

export function matchesNotificationFilter(
  n: { type: NotificationType; read_at: string | null },
  filter: NotificationFilterKey
): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !n.read_at;
  return notificationFilterBucket(n.type) === filter;
}

export function notificationDateGroup(createdAt: string, now = new Date()): NotificationDateGroup {
  const d = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  if (d >= startOfWeek) return "this_week";
  return "earlier";
}

export const DATE_GROUP_LABELS: Record<NotificationDateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  earlier: "Earlier",
};

export const DATE_GROUP_ORDER: NotificationDateGroup[] = [
  "today",
  "yesterday",
  "this_week",
  "earlier",
];

export function groupNotificationsByDate<T extends { created_at: string }>(
  items: T[],
  now = new Date()
): { group: NotificationDateGroup; label: string; items: T[] }[] {
  const buckets = new Map<NotificationDateGroup, T[]>();
  for (const item of items) {
    const g = notificationDateGroup(item.created_at, now);
    const list = buckets.get(g) ?? [];
    list.push(item);
    buckets.set(g, list);
  }
  return DATE_GROUP_ORDER.filter((g) => buckets.has(g)).map((g) => ({
    group: g,
    label: DATE_GROUP_LABELS[g],
    items: buckets.get(g)!,
  }));
}

export function countByFilter<T extends { type: NotificationType; read_at: string | null }>(
  items: T[]
): Record<NotificationFilterKey, number> {
  const counts: Record<NotificationFilterKey, number> = {
    all: items.length,
    unread: 0,
    watchlist: 0,
    social: 0,
    desk: 0,
    support: 0,
    billing: 0,
  };
  for (const n of items) {
    if (!n.read_at) counts.unread += 1;
    const bucket = notificationFilterBucket(n.type);
    if (bucket !== "all") counts[bucket] += 1;
  }
  return counts;
}

export type SnoozeDuration = "1h" | "tomorrow" | "1w";

export function snoozeUntilFromDuration(
  duration: SnoozeDuration,
  now = new Date()
): string {
  if (duration === "1h") {
    return new Date(now.getTime() + 3_600_000).toISOString();
  }
  if (duration === "1w") {
    return new Date(now.getTime() + 7 * 86_400_000).toISOString();
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
  if (tomorrow.getTime() <= now.getTime()) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  return tomorrow.toISOString();
}

export const SNOOZE_OPTIONS: { duration: SnoozeDuration; label: string }[] = [
  { duration: "1h", label: "Snooze 1 hour" },
  { duration: "tomorrow", label: "Until tomorrow 9am" },
  { duration: "1w", label: "Snooze 1 week" },
];
