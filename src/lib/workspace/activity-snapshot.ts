import { countFeedCallsSince } from "@/lib/feed/new-count";
import { countUnreadDmThreads } from "@/lib/messages/service";
import { fetchUnreadCount } from "@/lib/notifications/service";

export type WorkspaceActivitySnapshot = {
  notifUnread: number;
  dmUnread: number;
  feedNewCount: number;
  at: string;
};

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

export const WORKSPACE_ACTIVITY_EVENT = "portfuel:workspace-activity";

export function dispatchWorkspaceActivity(snapshot: WorkspaceActivitySnapshot) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(WORKSPACE_ACTIVITY_EVENT, { detail: snapshot })
  );
  window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
  window.dispatchEvent(new Event("portfuel:dm-unread-changed"));
  window.dispatchEvent(
    new CustomEvent("portfuel:feed-activity-changed", {
      detail: { feedNewCount: snapshot.feedNewCount },
    })
  );
}

/** Server-side SSE poll cadence while a client is connected. */
export const WORKSPACE_STREAM_POLL_MS = 20_000;
