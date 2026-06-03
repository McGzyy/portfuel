import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { fetchMemberWinCandidates } from "@/lib/social/member-win-scan";
import { fetchWeeklyDigestRows } from "@/lib/social/weekly-digest";
import { hasSocialPostBeenSent, listSocialPostLog } from "@/lib/social/post-log";

function milestonesForCall(call: {
  return_pct: number | null;
  target_progress: number | null;
}): CallMilestoneKey[] {
  const keys: CallMilestoneKey[] = [];
  const ret = call.return_pct;
  if (ret != null) {
    if (ret >= 10) keys.push("return_10");
    if (ret >= 25) keys.push("return_25");
  }
  if (call.target_progress != null && call.target_progress >= 100) {
    keys.push("target_reached");
  }
  return keys;
}

export async function fetchDeskMilestoneQueue() {
  let calls: {
    id: string;
    symbol: string;
    direction: string;
    return_pct: number | null;
    target_progress: number | null;
  }[] = [];

  if (isDemoMode()) {
    calls = getDemoCallsFeed("latest")
      .filter((c) => c.is_fueled)
      .map((c) => ({
        id: c.id,
        symbol: c.symbol,
        direction: c.direction,
        return_pct: c.return_pct,
        target_progress: c.target_progress ?? null,
      }));
  } else {
    const db = createServiceClient();
    const { data, error } = await db
      .from("calls")
      .select("id, symbol, direction, return_pct, target_progress")
      .eq("is_fueled", true)
      .order("return_pct", { ascending: false })
      .limit(15);
    if (error) {
      console.error("[social-activity/desk]", error);
      return [];
    }
    calls = (data ?? []) as typeof calls;
  }

  const pending: Array<{
    callId: string;
    symbol: string;
    direction: string;
    milestone: CallMilestoneKey;
    returnPct: number | null;
  }> = [];

  for (const call of calls) {
    for (const milestone of milestonesForCall(call)) {
      const refId = `milestone-${call.id}-${milestone}`;
      const posted = await hasSocialPostBeenSent("fueled_milestone", refId);
      if (!posted) {
        pending.push({
          callId: call.id,
          symbol: call.symbol,
          direction: call.direction,
          milestone,
          returnPct: call.return_pct,
        });
      }
    }
  }
  return pending;
}

export async function fetchSocialActivitySnapshot() {
  const published = await listSocialPostLog(50);
  const memberWins = await fetchMemberWinCandidates(12);
  const deskMilestones = await fetchDeskMilestoneQueue();
  const weeklyRows = await fetchWeeklyDigestRows(3);
  const weekKey = new Date().toISOString().slice(0, 10);
  const weeklyRef = `weekly-digest-${weekKey}`;
  const weeklyAlready = published.some(
    (p) => p.postType === "weekly_digest" && p.refId === weeklyRef
  );

  return {
    published,
    queue: {
      memberWins,
      deskMilestones,
      weeklyDigest: {
        eligible: weeklyRows.length > 0,
        rowCount: weeklyRows.length,
        alreadyPostedThisWeek: weeklyAlready,
      },
    },
  };
}
