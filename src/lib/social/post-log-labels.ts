import type { XPostType } from "@/lib/social/x-config";

export const POST_TYPE_LABELS: Record<XPostType, string> = {
  fueled: "Fueled desk",
  leaderboard: "Rankings",
  fueled_milestone: "Desk milestone",
  member_win: "Member spotlight",
  member_win_update: "Member update",
  weekly_digest: "Weekly digest",
};

export function describePostRef(postType: XPostType, refId: string): string {
  if (postType === "member_win" && refId.length === 36) {
    return `Call ${refId.slice(0, 8)}…`;
  }
  if (postType === "member_win_update" && refId.includes("still_running")) {
    return "Member spotlight · still running";
  }
  if (postType === "member_win_update" && refId.startsWith("member_win_update-")) {
    const parts = refId.replace("member_win_update-", "").split("-");
    const milestone = parts[parts.length - 1];
    return `Update · ${milestone.replace(/_/g, " ")}`;
  }
  if (postType === "fueled_milestone" && refId.startsWith("milestone-")) {
    return refId.replace("milestone-", "").replace(/-/g, " · ");
  }
  if (postType === "leaderboard" && refId.startsWith("leaderboard-")) {
    return refId.replace("leaderboard-", "Week of ");
  }
  if (postType === "weekly_digest" && refId.startsWith("weekly-digest-")) {
    return refId.replace("weekly-digest-", "Week of ");
  }
  return refId;
}

export function tweetUrl(tweetId: string | null): string | null {
  if (!tweetId || tweetId === "dry_run" || tweetId === "unknown") return null;
  return `https://x.com/i/web/status/${tweetId}`;
}
