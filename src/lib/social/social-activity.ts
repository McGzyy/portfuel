import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import type { CallMilestoneKey } from "@/lib/notifications/milestone-keys";
import { callMilestoneKeysForCall } from "@/lib/notifications/milestone-keys";
import { fetchMemberWinCandidates } from "@/lib/social/member-win-scan";
import { fetchWeeklyDigestRows } from "@/lib/social/weekly-digest";
import { hasSocialPostBeenSent, listSocialPostLog } from "@/lib/social/post-log";

export async function fetchDeskMilestoneQueue() {
  let calls: {
    id: string;
    symbol: string;
    direction: string;
    return_pct: number | null;
    target_progress: number | null;
    entry_price: number | null;
    target_price: number | null;
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
        entry_price: c.entry_price ?? null,
        target_price: c.target_price ?? null,
      }));
  } else {
    const db = createServiceClient();
    const { data, error } = await db
      .from("calls")
      .select("id, symbol, direction, return_pct, target_progress, entry_price, target_price")
      .eq("is_fueled", true)
      .order("return_pct", { ascending: false })
      .limit(15);
    if (error) {
      console.error("[social-activity/desk]", error);
      return [];
    }
    calls = (data ?? []).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      direction: c.direction,
      return_pct: c.return_pct != null ? Number(c.return_pct) : null,
      target_progress: c.target_progress != null ? Number(c.target_progress) : null,
      entry_price: c.entry_price != null ? Number(c.entry_price) : null,
      target_price: c.target_price != null ? Number(c.target_price) : null,
    }));
  }

  const pending: Array<{
    callId: string;
    symbol: string;
    direction: string;
    milestone: CallMilestoneKey;
    returnPct: number | null;
  }> = [];

  for (const call of calls) {
    for (const milestone of callMilestoneKeysForCall(call)) {
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
