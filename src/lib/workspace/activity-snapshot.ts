import { countFeedCallsSince } from "@/lib/feed/new-count";
import { countUnreadDmThreads } from "@/lib/messages/service";
import { fetchUnreadCount } from "@/lib/notifications/service";
import type { WorkspaceActivitySnapshot } from "@/lib/workspace/activity-events";

export type { WorkspaceActivitySnapshot } from "@/lib/workspace/activity-events";
export {
  WORKSPACE_ACTIVITY_EVENT,
  WORKSPACE_STREAM_POLL_MS,
  dispatchWorkspaceActivity,
} from "@/lib/workspace/activity-events";

export async function fetchWorkspaceActivitySnapshot(
  userId: string,
  feedSeenAtMs: number
): Promise<WorkspaceActivitySnapshot> {
  const [notifUnread, dmUnread, feedNewCount] = await Promise.all([
    fetchUnreadCount(userId),
    countUnreadDmThreads(userId),
    countFeedCallsSince(feedSeenAtMs),
  ]);

  return {
    notifUnread,
    dmUnread,
    feedNewCount,
    at: new Date().toISOString(),
  };
}
