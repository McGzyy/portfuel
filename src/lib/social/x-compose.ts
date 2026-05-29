import { createServiceClient } from "@/lib/db/supabase";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { appPath } from "@/lib/social/app-url";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import type { XPostType } from "@/lib/social/x-config";
import {
  applyCopyTemplate,
  composeMilestonePostText,
  fetchSocialPostCopy,
} from "@/lib/social/copy-templates";

function trimTweet(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function composeXPost(
  type: XPostType,
  opts?: { callId?: string; milestone?: CallMilestoneKey }
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
