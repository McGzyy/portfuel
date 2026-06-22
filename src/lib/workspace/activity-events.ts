/** Client-safe workspace activity types and browser events (no server imports). */

export type WorkspaceActivitySnapshot = {
  notifUnread: number;
  dmUnread: number;
  feedNewCount: number;
  researchNewCount: number;
  at: string;
};

export const WORKSPACE_ACTIVITY_EVENT = "portfuel:workspace-activity";

/** Server-side SSE poll cadence while a client is connected. */
export const WORKSPACE_STREAM_POLL_MS = 20_000;

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
  window.dispatchEvent(
    new CustomEvent("portfuel:research-activity-changed", {
      detail: { researchNewCount: snapshot.researchNewCount },
    })
  );
}
