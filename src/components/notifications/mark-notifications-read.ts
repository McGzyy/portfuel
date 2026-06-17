import type { UserNotification } from "@/lib/notifications/types";

export async function markNotificationsReadByIds(ids: string[]): Promise<number | null> {
  const realIds = ids.filter((id) => !id.startsWith("demo-"));
  if (realIds.length === 0) return null;

  const res = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: realIds }),
  });
  const data = await res.json();
  if (!res.ok) return null;

  window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  return typeof data.unreadCount === "number" ? data.unreadCount : null;
}

export function applyLocalNotificationRead(
  items: UserNotification[],
  ids: string[],
  now = new Date().toISOString()
): UserNotification[] {
  const idSet = new Set(ids);
  return items.map((n) => (idSet.has(n.id) ? { ...n, read_at: n.read_at ?? now } : n));
}
