import { cache } from "react";
import { cookies } from "next/headers";
import { countFeedCallsSince } from "@/lib/feed/new-count";
import { FEED_SEEN_COOKIE, parseFeedSeenAt } from "@/lib/feed/last-seen";
import { countUnreadDmThreads } from "@/lib/messages/service";
import { fetchUnreadCount } from "@/lib/notifications/service";
import {
  WORKSPACE_STREAM_POLL_MS,
  type WorkspaceActivitySnapshot,
} from "@/lib/workspace/activity-events";

export { WORKSPACE_STREAM_POLL_MS, type WorkspaceActivitySnapshot };

export async function fetchWorkspaceActivitySnapshot(
  userId: string,
  feedSeenAtMs: number
): Promise<WorkspaceActivitySnapshot> {
  const [feedNewCount, dmUnread, notifUnread] = await Promise.all([
    countFeedCallsSince(feedSeenAtMs).catch(() => 0),
    countUnreadDmThreads(userId).catch(() => 0),
    fetchUnreadCount(userId).catch(() => 0),
  ]);
  return {
    feedNewCount,
    dmUnread,
    notifUnread,
    at: new Date().toISOString(),
  };
}

/** Deduped per-request workspace inbox + feed activity counts. */
export const loadWorkspaceActivitySnapshot = cache(
  async (userId: string): Promise<WorkspaceActivitySnapshot> => {
    const cookieStore = await cookies();
    const feedSeenAtMs = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);
    return fetchWorkspaceActivitySnapshot(userId, feedSeenAtMs);
  }
);
