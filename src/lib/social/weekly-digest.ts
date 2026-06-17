import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { getMemberWinGateConfig } from "@/lib/social/member-win-config";
import { isSymbolBlockedForMemberWin } from "@/lib/social/member-win-blocklist";
import { meetsMemberWinReturnAgeGate } from "@/lib/social/member-win-eligibility";
import { renderWeeklyDigestOgPng } from "@/lib/charts/weekly-digest-og";
import { appPath } from "@/lib/social/app-url";
import { applyCopyTemplate, fetchSocialPostCopy } from "@/lib/social/copy-templates";

export type WeeklyDigestRow = {
  symbol: string;
  direction: string;
  returnPct: number;
  handle: string;
};

export function formatWeeklyDigestLineX(row: WeeklyDigestRow, index: number): string {
  const ret = `${row.returnPct >= 0 ? "+" : ""}${row.returnPct.toFixed(1)}%`;
  return `${index + 1}. $${row.symbol} ${row.direction} · ${ret} · ${row.handle}`;
}

export function formatWeeklyDigestLineDiscord(row: WeeklyDigestRow, index: number): string {
  const ret = `${row.returnPct >= 0 ? "+" : ""}${row.returnPct.toFixed(1)}%`;
  const dir = row.direction.toUpperCase();
  return `**${index + 1}.** **${row.symbol}** ${dir} **${ret}** — ${row.handle}`;
}

export async function renderWeeklyDigestChartPng(limit = 3): Promise<Buffer | null> {
  const rows = await fetchWeeklyDigestRows(limit);
  if (rows.length === 0) return null;
  return renderWeeklyDigestOgPng(rows);
}

function trimTweet(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function fetchWeeklyDigestRows(limit = 3): Promise<WeeklyDigestRow[]> {
  if (isDemoMode()) {
    return getDemoCallsFeed("performing")
      .filter((c) => !c.is_fueled && (c.return_pct ?? 0) >= 15)
      .slice(0, limit)
      .map((c, i) => ({
        symbol: c.symbol,
        direction: c.direction,
        returnPct: c.return_pct ?? 20,
        handle: c.users.username ? `@${c.users.username}` : c.users.display_name ?? `Member ${i + 1}`,
      }));
  }

  const db = createServiceClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const cfg = getMemberWinGateConfig();

  const { data, error } = await db
    .from("calls")
    .select(
      "symbol, direction, return_pct, called_at, is_fueled, users!inner(username, display_name, subscription_status)"
    )
    .eq("is_fueled", false)
    .gte("called_at", since)
    .not("return_pct", "is", null)
    .gte("return_pct", cfg.minReturnPct)
    .order("return_pct", { ascending: false })
    .limit(20);

  if (error || !data?.length) return [];

  const rows: WeeklyDigestRow[] = [];
  for (const raw of data) {
    const c = raw as unknown as {
      symbol: string;
      direction: string;
      return_pct: number;
      called_at: string;
      is_fueled: boolean;
      users: {
        username: string | null;
        display_name: string | null;
        subscription_status: string;
      };
    };
    if (c.users.subscription_status !== "active") continue;
    if (isSymbolBlockedForMemberWin(c.symbol)) continue;
    if (!meetsMemberWinReturnAgeGate(c).ok) continue;

    rows.push({
      symbol: c.symbol,
      direction: c.direction,
      returnPct: c.return_pct,
      handle: c.users.username
        ? `@${c.users.username}`
        : (c.users.display_name ?? "Member"),
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

export async function composeWeeklyDigestPost(
  rows?: WeeklyDigestRow[]
): Promise<
  | { ok: true; text: string; refId: string; rows: WeeklyDigestRow[] }
  | { ok: false; error: "no_content" }
> {
  const wins = rows ?? (await fetchWeeklyDigestRows(3));
  if (wins.length === 0) return { ok: false, error: "no_content" };

  const copy = await fetchSocialPostCopy();
  const lines = wins.map((w, i) => formatWeeklyDigestLineX(w, i));
  const week = new Date().toISOString().slice(0, 10);
  const link = appPath("/", {
    source: "x",
    medium: "social",
    campaign: "weekly_digest",
  });
  const text = trimTweet(
    applyCopyTemplate(copy.weeklyDigestTemplate, {
      digest_lines: lines.join("\n"),
      link,
      disclaimer: copy.disclaimer,
    })
  );

  return {
    ok: true,
    text,
    refId: `weekly-digest-${week}`,
    rows: wins,
  };
}
