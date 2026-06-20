import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoNotifications } from "@/lib/notifications/demo";

/** Count member (non-Fueled) calls published since the feed last-seen timestamp. */
export async function countFeedCallsSince(seenAtMs: number): Promise<number> {
  if (seenAtMs <= 0) return 0;

  if (isDemoMode()) {
    const demoNew = getDemoNotifications().filter((n) => n.type === "watchlist_call").length;
    return seenAtMs > 0 ? demoNew : 0;
  }

  const db = createServiceClient();
  const since = new Date(seenAtMs).toISOString();
  const { count, error } = await db
    .from("calls")
    .select("id", { count: "exact", head: true })
    .eq("is_fueled", false)
    .gte("called_at", since);

  if (error) throw error;
  return count ?? 0;
}
