import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  isMemberWinReadyToPost,
  meetsMemberWinReturnAgeGate,
} from "@/lib/social/member-win-eligibility";
import { MEMBER_WIN_GATE_MILESTONE_KEY } from "@/lib/social/member-win-config";
import { isSymbolBlockedForMemberWin } from "@/lib/social/member-win-blocklist";
import { hasSocialPostBeenSent, getSocialPostTweetId } from "@/lib/social/post-log";
import { composeMemberWinPost } from "@/lib/social/x-compose";
import { memberWinChartUrl, postMemberWin } from "@/lib/social/x-member-win-post";
import {
  SPOTLIGHT_DECLINED_KEY,
  SPOTLIGHT_PROMPT_MIN_RETURN_PCT,
  SPOTLIGHT_REQUESTED_KEY,
} from "@/lib/social/spotlight-config";

export type SpotlightUiStatus =
  | "hidden"
  | "needs_opt_in"
  | "prompt"
  | "pending_review"
  | "posted"
  | "declined";

type CallSpotlightRow = {
  id: string;
  user_id: string;
  symbol: string;
  direction: string;
  return_pct: number | null;
  called_at: string;
  is_fueled: boolean;
  closed_at: string | null;
  users: {
    allow_social_highlight: boolean;
    subscription_status: string;
  };
};

async function loadCallForSpotlight(callId: string): Promise<CallSpotlightRow | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "id, user_id, symbol, direction, return_pct, called_at, is_fueled, closed_at, users!inner(allow_social_highlight, subscription_status)"
    )
    .eq("id", callId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as CallSpotlightRow;
}

async function hasMilestoneKey(callId: string, key: string): Promise<boolean> {
  const db = createServiceClient();
  const { data } = await db
    .from("call_milestones")
    .select("id")
    .eq("call_id", callId)
    .eq("key", key)
    .maybeSingle();
  return Boolean(data);
}

async function recordSpotlightMilestone(
  callId: string,
  userId: string,
  key: string
): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from("call_milestones").insert({
    call_id: callId,
    user_id: userId,
    key,
  } as never);
  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[spotlight/milestone]", error);
  return false;
}

function meetsPromptReturn(ret: number | null): boolean {
  return ret != null && ret >= SPOTLIGHT_PROMPT_MIN_RETURN_PCT;
}

export async function getCallSpotlightState(
  callId: string,
  viewerUserId: string
): Promise<{
  status: SpotlightUiStatus;
  chartUrl?: string;
  previewText?: string;
  tweetUrl?: string;
  returnPct?: number | null;
  symbol?: string;
}> {
  const call = await loadCallForSpotlight(callId);
  if (!call || call.user_id !== viewerUserId) return { status: "hidden" };

  if (call.is_fueled || call.closed_at) return { status: "hidden" };
  if (isSymbolBlockedForMemberWin(call.symbol)) return { status: "hidden" };
  if (!meetsPromptReturn(call.return_pct)) return { status: "hidden" };
  if (call.users.subscription_status !== "active") return { status: "hidden" };

  const posted = await hasSocialPostBeenSent("member_win", call.id);
  if (posted) {
    const tweetId = await getSocialPostTweetId("member_win", call.id);
    return {
      status: "posted",
      symbol: call.symbol,
      returnPct: call.return_pct,
      tweetUrl:
        tweetId && tweetId !== "dry_run"
          ? `https://x.com/i/web/status/${tweetId}`
          : undefined,
    };
  }

  if (await hasMilestoneKey(call.id, SPOTLIGHT_DECLINED_KEY)) {
    return { status: "declined", symbol: call.symbol, returnPct: call.return_pct };
  }

  if (await hasMilestoneKey(call.id, SPOTLIGHT_REQUESTED_KEY)) {
    return { status: "pending_review", symbol: call.symbol, returnPct: call.return_pct };
  }

  const needsOptIn = !call.users.allow_social_highlight;

  const composed = await composeMemberWinPost(call.id, {
    skipReadiness: true,
    previewOptIn: true,
  });

  const base = {
    symbol: call.symbol,
    returnPct: call.return_pct,
    chartUrl: memberWinChartUrl(call.id),
    previewText: composed.ok ? composed.text : undefined,
  };

  if (needsOptIn) {
    return { status: "needs_opt_in", ...base };
  }

  return { status: "prompt", ...base };
}

async function canAutoPostNow(call: CallSpotlightRow): Promise<boolean> {
  const ageCheck = meetsMemberWinReturnAgeGate(call);
  if (!ageCheck.ok) return false;

  const db = createServiceClient();
  const { data: gate } = await db
    .from("call_milestones")
    .select("created_at")
    .eq("call_id", call.id)
    .eq("key", MEMBER_WIN_GATE_MILESTONE_KEY)
    .maybeSingle();

  const gateAt = (gate as { created_at?: string } | null)?.created_at ?? null;
  return isMemberWinReadyToPost({ call, gateRecordedAt: gateAt });
}

export async function confirmCallSpotlight(
  callId: string,
  viewerUserId: string,
  opts?: { allowHighlight?: boolean }
): Promise<
  | { ok: true; mode: "posted"; tweetId?: string; tweetUrl?: string }
  | { ok: true; mode: "pending_review" }
  | { ok: false; error: string }
> {
  if (isDemoMode()) {
    return { ok: false, error: "demo_readonly" };
  }

  const call = await loadCallForSpotlight(callId);
  if (!call || call.user_id !== viewerUserId) {
    return { ok: false, error: "forbidden" };
  }
  if (call.is_fueled || call.closed_at) return { ok: false, error: "not_eligible" };
  if (!meetsPromptReturn(call.return_pct)) return { ok: false, error: "not_eligible" };

  if (await hasSocialPostBeenSent("member_win", call.id)) {
    return { ok: false, error: "already_posted" };
  }
  if (await hasMilestoneKey(call.id, SPOTLIGHT_DECLINED_KEY)) {
    return { ok: false, error: "declined" };
  }

  const db = createServiceClient();
  if (opts?.allowHighlight === true) {
    await db
      .from("users")
      .update({
        allow_social_highlight: true,
        social_highlight_consented_at: new Date().toISOString(),
      } as never)
      .eq("id", viewerUserId);
    call.users.allow_social_highlight = true;
  }

  if (!call.users.allow_social_highlight) {
    return { ok: false, error: "opt_in_required" };
  }

  if (await canAutoPostNow(call)) {
    const result = await postMemberWin({ callId: call.id, force: false });
    if (!result.ok) {
      if (result.error === "already_posted") {
        return { ok: false, error: "already_posted" };
      }
      await recordSpotlightMilestone(call.id, call.user_id, SPOTLIGHT_REQUESTED_KEY);
      return { ok: true, mode: "pending_review" };
    }

    const tweetUrl =
      result.tweetId && result.tweetId !== "dry_run"
        ? `https://x.com/i/web/status/${result.tweetId}`
        : undefined;

    return { ok: true, mode: "posted", tweetId: result.tweetId, tweetUrl };
  }

  await recordSpotlightMilestone(call.id, call.user_id, SPOTLIGHT_REQUESTED_KEY);
  return { ok: true, mode: "pending_review" };
}

export async function declineCallSpotlight(
  callId: string,
  viewerUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const call = await loadCallForSpotlight(callId);
  if (!call || call.user_id !== viewerUserId) {
    return { ok: false, error: "forbidden" };
  }

  await recordSpotlightMilestone(call.id, call.user_id, SPOTLIGHT_DECLINED_KEY);
  return { ok: true };
}
