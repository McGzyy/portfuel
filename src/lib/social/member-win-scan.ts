import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { MEMBER_WIN_GATE_MILESTONE_KEY } from "@/lib/social/member-win-config";
import {
  isMemberWinReadyToPost,
  meetsMemberWinReturnAgeGate,
} from "@/lib/social/member-win-eligibility";
import { isSymbolBlockedForMemberWin } from "@/lib/social/member-win-blocklist";
import { hasSocialPostBeenSent } from "@/lib/social/post-log";

export type MemberWinCandidate = {
  callId: string;
  symbol: string;
  direction: string;
  returnPct: number | null;
  calledAt: string;
  userId: string;
  username: string | null;
  displayName: string | null;
  gateAt: string;
  status: "ready" | "waiting_sustain" | "already_posted";
};

export async function fetchMemberWinCandidates(limit = 10): Promise<MemberWinCandidate[]> {
  if (isDemoMode()) {
    const now = Date.now();
    const candidates = getDemoCallsFeed("performing")
      .filter((c) => !c.is_fueled && (c.return_pct ?? 0) >= 15)
      .slice(0, limit);

    return candidates.map((c, i) => ({
      callId: c.id,
      symbol: c.symbol,
      direction: c.direction,
      returnPct: c.return_pct,
      calledAt: c.called_at,
      userId: c.user_id,
      username: c.users.username,
      displayName: c.users.display_name,
      gateAt: new Date(now - (52 - i * 8) * 3_600_000).toISOString(),
      status: i === 0 ? "ready" : i === 1 ? "waiting_sustain" : "ready",
    }));
  }

  const db = createServiceClient();
  const { data: users, error: usersErr } = await db
    .from("users")
    .select("id")
    .eq("allow_social_highlight", true)
    .eq("subscription_status", "active");

  if (usersErr || !users?.length) return [];

  const userIds = users.map((u) => (u as { id: string }).id);

  const { data: calls, error: callsErr } = await db
    .from("calls")
    .select(
      "id, symbol, direction, return_pct, called_at, user_id, is_fueled, users!inner(username, display_name)"
    )
    .in("user_id", userIds)
    .eq("is_fueled", false)
    .not("return_pct", "is", null)
    .order("return_pct", { ascending: false })
    .limit(80);

  if (callsErr || !calls?.length) return [];

  const out: MemberWinCandidate[] = [];

  for (const row of calls) {
    const c = row as unknown as {
      id: string;
      symbol: string;
      direction: string;
      return_pct: number | null;
      called_at: string;
      user_id: string;
      is_fueled: boolean;
      users: { username: string | null; display_name: string | null };
    };

    if (isSymbolBlockedForMemberWin(c.symbol)) continue;

    const ageCheck = meetsMemberWinReturnAgeGate(c);
    if (!ageCheck.ok) continue;

    const { data: gate } = await db
      .from("call_milestones")
      .select("created_at")
      .eq("call_id", c.id)
      .eq("key", MEMBER_WIN_GATE_MILESTONE_KEY)
      .maybeSingle();

    const gateAt = (gate as { created_at?: string } | null)?.created_at ?? null;
    if (!gateAt) continue;

    const already = await hasSocialPostBeenSent("member_win", c.id);
    if (already) continue;

    const ready = isMemberWinReadyToPost({
      call: c,
      gateRecordedAt: gateAt,
    });

    out.push({
      callId: c.id,
      symbol: c.symbol,
      direction: c.direction,
      returnPct: c.return_pct,
      calledAt: c.called_at,
      userId: c.user_id,
      username: c.users.username,
      displayName: c.users.display_name,
      gateAt,
      status: ready ? "ready" : "waiting_sustain",
    });

    if (out.length >= limit) break;
  }

  return out.sort((a, b) => {
    if (a.status === "ready" && b.status !== "ready") return -1;
    if (b.status === "ready" && a.status !== "ready") return 1;
    return (b.returnPct ?? 0) - (a.returnPct ?? 0);
  });
}

export async function pickNextMemberWinCallId(): Promise<string | null> {
  const ready = (await fetchMemberWinCandidates(20)).find((c) => c.status === "ready");
  return ready?.callId ?? null;
}
