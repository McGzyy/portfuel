import { createServiceClient } from "@/lib/db/supabase";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { appPath } from "@/lib/social/app-url";
import type { XPostType } from "@/lib/social/x-config";

const DISCLAIMER = "Not investment advice.";

function trimTweet(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function composeXPost(type: XPostType): Promise<
  | { ok: true; text: string; refId: string }
  | { ok: false; error: "no_content" | "unsupported" }
> {
  if (type === "fueled") return composeFueledPost();
  if (type === "leaderboard") return composeLeaderboardPost();
  return { ok: false, error: "unsupported" };
}

async function composeFueledPost(): Promise<
  | { ok: true; text: string; refId: string }
  | { ok: false; error: "no_content" }
> {
  if (isDemoMode()) {
    const call = getDemoCallsFeed("latest").find((c) => c.is_fueled);
    if (!call) return { ok: false, error: "no_content" };
    const link = appPath(`/ticker/${call.symbol}`, { source: "x", medium: "social", campaign: "fueled" });
    const thesis =
      call.thesis.length > 100 ? `${call.thesis.slice(0, 97)}…` : call.thesis;
    const text = trimTweet(
      `Fueled desk · ${call.symbol} ${call.direction}\n${thesis}\n${link}\n${DISCLAIMER}`
    );
    return { ok: true, text, refId: call.id };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("id, symbol, direction, thesis, called_at")
    .eq("is_fueled", true)
    .order("called_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "no_content" };

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
    `Fueled desk · ${data.symbol} ${data.direction}\n${thesis}\n${link}\n${DISCLAIMER}`
  );
  return { ok: true, text, refId: data.id };
}

async function composeLeaderboardPost(): Promise<
  | { ok: true; text: string; refId: string }
  | { ok: false; error: "no_content" }
> {
  const rows = await fetchLeaderboard(3);
  if (rows.length === 0) return { ok: false, error: "no_content" };

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
    `PortFuel rankings\n${lines.join("\n")}\n${link}\n${DISCLAIMER}`
  );
  return { ok: true, text, refId: `leaderboard-${week}` };
}
