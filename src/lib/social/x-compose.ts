import { createServiceClient } from "@/lib/db/supabase";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { appPath } from "@/lib/social/app-url";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import type { XPostType } from "@/lib/social/x-config";
import { isSymbolBlockedForMemberWin } from "@/lib/social/member-win-blocklist";
import { MEMBER_WIN_GATE_MILESTONE_KEY } from "@/lib/social/member-win-config";
import {
  isMemberWinReadyToPost,
  meetsMemberWinReturnAgeGate,
} from "@/lib/social/member-win-eligibility";
import {
  applyCopyTemplate,
  composeMilestonePostText,
  fetchSocialPostCopy,
} from "@/lib/social/copy-templates";
import { resolveMemberWinCopyVariant } from "@/lib/social/copy-variant";
import type { SocialPostCopyVariantId } from "@/lib/social/copy-variant";

function trimTweet(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function composeXPost(
  type: XPostType,
  opts?: {
    callId?: string;
    milestone?: CallMilestoneKey;
    /** Admin preview — skip sustain timer check. */
    skipMemberWinReadiness?: boolean;
  }
): Promise<
  | {
      ok: true;
      text: string;
      lead?: string;
      tail?: string;
      refId: string;
      callId?: string;
      milestone?: CallMilestoneKey;
      withChart: boolean;
    }
  | { ok: false; error: "no_content" | "unsupported" }
> {
  if (type === "fueled_milestone" && opts?.callId && opts.milestone) {
    return composeFueledMilestonePost(opts.callId, opts.milestone);
  }
  if (type === "fueled") {
    const result = await composeFueledPost();
    if (!result.ok) return result;
    return { ...result, withChart: false };
  }
  if (type === "leaderboard") {
    const result = await composeLeaderboardPost();
    if (!result.ok) return result;
    return { ...result, withChart: false };
  }
  if (type === "member_win" && opts?.callId) {
    return composeMemberWinPost(opts.callId, {
      skipReadiness: opts.skipMemberWinReadiness,
    });
  }
  return { ok: false, error: "unsupported" };
}

export async function composeFueledPostByCallId(callId: string): Promise<
  | { ok: true; text: string; refId: string }
  | { ok: false; error: "no_content" }
> {
  if (isDemoMode()) {
    const call = getDemoCallsFeed("latest").find((c) => c.id === callId && c.is_fueled);
    if (!call) return { ok: false, error: "no_content" };
    const copy = await fetchSocialPostCopy();
    const link = appPath(`/ticker/${call.symbol}`, {
      source: "x",
      medium: "social",
      campaign: "fueled",
    });
    const thesis =
      call.thesis.length > 100 ? `${call.thesis.slice(0, 97)}…` : call.thesis;
    const text = trimTweet(
      applyCopyTemplate(copy.fueledTemplate, {
        symbol: call.symbol,
        direction: call.direction,
        thesis,
        link,
        disclaimer: copy.disclaimer,
      })
    );
    return { ok: true, text, refId: call.id };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("id, symbol, direction, thesis, called_at")
    .eq("id", callId)
    .eq("is_fueled", true)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "no_content" };

  const copy = await fetchSocialPostCopy();
  const link = appPath(`/ticker/${data.symbol}`, {
    source: "x",
    medium: "social",
    campaign: "fueled",
  });
  const thesis =
    (data.thesis?.length ?? 0) > 100
      ? `${data.thesis!.slice(0, 97)}…`
      : (data.thesis ?? "");
  const text = trimTweet(
    applyCopyTemplate(copy.fueledTemplate, {
      symbol: data.symbol,
      direction: data.direction,
      thesis,
      link,
      disclaimer: copy.disclaimer,
    })
  );
  return { ok: true, text, refId: data.id };
}

export async function composeFueledMilestonePost(
  callId: string,
  milestone: CallMilestoneKey
): Promise<
  | {
      ok: true;
      text: string;
      lead: string;
      tail: string;
      refId: string;
      callId: string;
      milestone: CallMilestoneKey;
      withChart: true;
    }
  | { ok: false; error: "no_content" }
> {
  type CallRow = {
    id: string;
    symbol: string;
    direction: string;
    return_pct: number | null;
    is_fueled: boolean;
  };

  let call: CallRow | undefined;

  if (isDemoMode()) {
    call = getDemoCallsFeed("latest").find((c) => c.id === callId && c.is_fueled);
  } else {
    const db = createServiceClient();
    const { data, error } = await db
      .from("calls")
      .select("id, symbol, direction, return_pct, is_fueled")
      .eq("id", callId)
      .eq("is_fueled", true)
      .maybeSingle();
    if (error || !data) return { ok: false, error: "no_content" };
    call = data as CallRow;
  }

  if (!call) return { ok: false, error: "no_content" };

  const copy = await fetchSocialPostCopy();
  const link = appPath(`/ticker/${call.symbol}`, {
    source: "x",
    medium: "social",
    campaign: "fueled_milestone",
  });
  const { lead, tail, text } = composeMilestonePostText(copy, {
    milestone,
    symbol: call.symbol,
    direction: call.direction,
    returnPct: call.return_pct,
    link,
  });

  return {
    ok: true,
    text,
    lead,
    tail,
    refId: `milestone-${callId}-${milestone}`,
    callId,
    milestone,
    withChart: true,
  };
}

async function composeFueledPost(): Promise<
  | { ok: true; text: string; refId: string }
  | { ok: false; error: "no_content" }
> {
  if (isDemoMode()) {
    const call = getDemoCallsFeed("latest").find((c) => c.is_fueled);
    if (!call) return { ok: false, error: "no_content" };
    return composeFueledPostByCallId(call.id);
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("id")
    .eq("is_fueled", true)
    .order("called_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "no_content" };
  return composeFueledPostByCallId(data.id);
}

async function composeLeaderboardPost(): Promise<
  | { ok: true; text: string; refId: string }
  | { ok: false; error: "no_content" }
> {
  const rows = await fetchLeaderboard(3);
  if (rows.length === 0) return { ok: false, error: "no_content" };

  const copy = await fetchSocialPostCopy();
  const lines = rows.map((r, i) => {
    const handle = r.username ? `@${r.username}` : r.display_name ?? "Member";
    return `${i + 1}. ${handle} · ${r.rank_score.toFixed(1)}`;
  });
  const link = appPath("/rankings", {
    source: "x",
    medium: "social",
    campaign: "leaderboard",
  });
  const week = new Date().toISOString().slice(0, 10);
  const text = trimTweet(
    applyCopyTemplate(copy.leaderboardTemplate, {
      leaderboard_lines: lines.join("\n"),
      link,
      disclaimer: copy.disclaimer,
    })
  );
  return { ok: true, text, refId: `leaderboard-${week}` };
}

export async function composeMemberWinPost(
  callId: string,
  opts?: { skipReadiness?: boolean }
): Promise<
  | {
      ok: true;
      text: string;
      refId: string;
      callId: string;
      withChart: true;
      copyVariant: SocialPostCopyVariantId;
    }
  | { ok: false; error: "no_content" }
> {
  const copyVariant = resolveMemberWinCopyVariant(callId);
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "id, symbol, direction, thesis, return_pct, called_at, is_fueled, user_id, users!inner(username, display_name, allow_social_highlight, social_highlight_show_thesis, social_highlight_show_username, subscription_status)"
    )
    .eq("id", callId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "no_content" };

  const row = data as unknown as {
    id: string;
    symbol: string;
    direction: string;
    thesis: string | null;
    return_pct: number | null;
    called_at: string;
    is_fueled: boolean;
    user_id: string;
    users: {
      username: string | null;
      display_name: string | null;
      allow_social_highlight: boolean;
      social_highlight_show_thesis: boolean;
      social_highlight_show_username: boolean;
      subscription_status: string;
    };
  };

  if (row.is_fueled) return { ok: false, error: "no_content" };
  if (isSymbolBlockedForMemberWin(row.symbol)) return { ok: false, error: "no_content" };
  if (!row.users.allow_social_highlight) return { ok: false, error: "no_content" };
  if (row.users.subscription_status !== "active") return { ok: false, error: "no_content" };

  const ageCheck = meetsMemberWinReturnAgeGate(row);
  if (!ageCheck.ok) return { ok: false, error: "no_content" };

  if (!opts?.skipReadiness) {
    const { data: gate } = await db
      .from("call_milestones")
      .select("created_at")
      .eq("call_id", callId)
      .eq("key", MEMBER_WIN_GATE_MILESTONE_KEY)
      .maybeSingle();

    const gateAt = (gate as { created_at?: string } | null)?.created_at ?? null;
    if (!isMemberWinReadyToPost({ call: row, gateRecordedAt: gateAt })) {
      return { ok: false, error: "no_content" };
    }
  }

  const copy = await fetchSocialPostCopy(copyVariant);
  const link = appPath(`/ticker/${row.symbol}`, {
    source: "x",
    medium: "social",
    campaign: "member_win",
  });

  const ret =
    row.return_pct != null
      ? `${row.return_pct >= 0 ? "+" : ""}${row.return_pct.toFixed(1)}%`
      : "";
  const returnLine = ret ? `${ret} since publication` : "";

  const handle = row.users.social_highlight_show_username
    ? row.users.username
      ? `@${row.users.username}`
      : (row.users.display_name ?? "Member")
    : (row.users.display_name ?? "Member");

  let thesisBlock = "";
  if (row.users.social_highlight_show_thesis && row.thesis?.trim()) {
    const t =
      row.thesis.length > 120 ? `${row.thesis.slice(0, 117)}…` : row.thesis;
    thesisBlock = `${t}\n`;
  }

  const text = trimTweet(
    applyCopyTemplate(copy.memberWinTemplate, {
      symbol: row.symbol,
      direction: row.direction,
      return_line: returnLine,
      member_handle: handle,
      thesis_block: thesisBlock,
      link,
      disclaimer: copy.disclaimer,
    })
  );

  return {
    ok: true,
    text,
    refId: row.id,
    callId: row.id,
    withChart: true,
    copyVariant,
  };
}

const MEMBER_UPDATE_HEADLINE: Record<
  "return_25" | "target_reached",
  string
> = {
  return_25: "Performance update · +25% on record",
  target_reached: "Stated target reached on record",
};

export async function composeMemberWinUpdatePost(
  callId: string,
  milestone: "return_25" | "target_reached"
): Promise<
  | { ok: true; text: string; refId: string; copyVariant: SocialPostCopyVariantId }
  | { ok: false; error: "no_content" }
> {
  const copyVariant = resolveMemberWinCopyVariant(callId);
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "id, symbol, direction, return_pct, is_fueled, users!inner(allow_social_highlight, subscription_status)"
    )
    .eq("id", callId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "no_content" };

  const row = data as unknown as {
    symbol: string;
    direction: string;
    return_pct: number | null;
    is_fueled: boolean;
    users: { allow_social_highlight: boolean; subscription_status: string };
  };

  if (row.is_fueled || !row.users.allow_social_highlight) {
    return { ok: false, error: "no_content" };
  }
  if (row.users.subscription_status !== "active") {
    return { ok: false, error: "no_content" };
  }

  const copy = await fetchSocialPostCopy(copyVariant);
  const link = appPath(`/ticker/${row.symbol}`, {
    source: "x",
    medium: "social",
    campaign: "member_win_update",
  });
  const ret =
    row.return_pct != null
      ? `${row.return_pct >= 0 ? "+" : ""}${row.return_pct.toFixed(1)}% since publication`
      : "";
  const text = trimTweet(
    applyCopyTemplate(copy.memberWinUpdateTemplate, {
      symbol: row.symbol,
      direction: row.direction,
      headline: MEMBER_UPDATE_HEADLINE[milestone],
      return_line: ret,
      link,
      disclaimer: copy.disclaimer,
    })
  );

  return {
    ok: true,
    text,
    refId: `member_win_update-${callId}-${milestone}`,
    copyVariant,
  };
}
