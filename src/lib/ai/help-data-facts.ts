import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed, getDemoMemberCalls } from "@/lib/demo/fixtures";
import {
  parseHelpQuestionDateRange,
  questionMentionsCommunityData,
  questionMentionsUserData,
  type HelpDateRange,
} from "@/lib/ai/help-question-dates";

type CallRow = {
  symbol: string;
  direction: string;
  return_pct: number | null;
  closed_at: string | null;
  called_at: string;
  users: { username: string | null; display_name: string | null };
};

function normalizeCallRow(
  row: {
    symbol: string;
    direction: string;
    return_pct: number | null;
    closed_at: string | null;
    called_at: string;
    users:
      | { username: string | null; display_name: string | null }
      | { username: string | null; display_name: string | null }[];
  }
): CallRow {
  const users = Array.isArray(row.users) ? row.users[0] : row.users;
  return {
    symbol: row.symbol,
    direction: row.direction,
    return_pct: row.return_pct,
    closed_at: row.closed_at,
    called_at: row.called_at,
    users: {
      username: users?.username ?? null,
      display_name: users?.display_name ?? null,
    },
  };
}

function formatCallLine(c: CallRow): string {
  const who = c.users.username ? `@${c.users.username}` : "member";
  const ret = c.return_pct != null ? `${Number(c.return_pct).toFixed(2)}%` : "—";
  const status = c.closed_at
    ? `closed ${c.closed_at.slice(0, 10)}`
    : `open (called ${c.called_at.slice(0, 10)})`;
  return `- ${c.symbol} ${c.direction} · return ${ret} · ${status} · ${who}`;
}

function inClosedRange(c: CallRow, range: HelpDateRange): boolean {
  if (!c.closed_at) return false;
  const t = new Date(c.closed_at).getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

function inCalledRange(c: CallRow, range: HelpDateRange): boolean {
  const t = new Date(c.called_at).getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

function wantsClosedCalls(question: string): boolean {
  return /\b(closed|close|realized|exit)\b/i.test(question);
}

function questionLooksDataRelated(question: string): boolean {
  return /\b(call|return|performance|closed|highest|best|top|how many|count|win|fueled|symbol|ticker)\b/i.test(
    question
  );
}

async function fetchUserCallFacts(
  userId: string,
  question: string,
  range: HelpDateRange | null
): Promise<string | null> {
  const closedOnly = wantsClosedCalls(question);

  if (isDemoMode()) {
    const calls = getDemoMemberCalls(userId, 50);
    if (calls.length === 0) {
      return "### Your calls (demo)\n- No sample calls for this account.";
    }
    let filtered = calls as unknown as CallRow[];
    if (range) {
      filtered = filtered.filter((c) =>
        closedOnly ? inClosedRange(c, range) : inCalledRange(c, range)
      );
    } else if (closedOnly) {
      filtered = filtered.filter((c) => c.closed_at);
    }
    const sorted = [...filtered].sort(
      (a, b) => (b.return_pct ?? -Infinity) - (a.return_pct ?? -Infinity)
    );
    const top = sorted.slice(0, 5);
    const label = range ? range.label : "all time";
    if (top.length === 0) {
      return `### Your calls (${label})\n- No matching calls in demo data for that period.`;
    }
    return [
      `### Your calls (${label}${closedOnly ? ", closed only" : ""})`,
      ...top.map((c) =>
        formatCallLine({
          symbol: c.symbol,
          direction: c.direction,
          return_pct: c.return_pct,
          closed_at: c.closed_at ?? null,
          called_at: c.called_at,
          users: {
            username: c.users.username,
            display_name: c.users.display_name,
          },
        })
      ),
    ].join("\n");
  }

  const db = createServiceClient();
  let query = db
    .from("calls")
    .select(
      "symbol, direction, return_pct, closed_at, called_at, users!inner(username, display_name)"
    )
    .eq("user_id", userId);

  if (range) {
    const col = closedOnly ? "closed_at" : "called_at";
    query = query
      .gte(col, range.start.toISOString())
      .lt(col, range.end.toISOString());
    if (closedOnly) query = query.not("closed_at", "is", null);
  } else if (closedOnly) {
    query = query.not("closed_at", "is", null);
  }

  const { data, error } = await query
    .order("return_pct", { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) {
    console.error("[help-data-facts user]", error);
    return "### Your calls\n- Could not load call data right now.";
  }

  const rows = (data ?? []).map(normalizeCallRow);
  const label = range ? range.label : "all time";
  if (rows.length === 0) {
    return `### Your calls (${label}${closedOnly ? ", closed only" : ""})\n- No matching calls on your account for that period.`;
  }

  return [
    `### Your calls (${label}${closedOnly ? ", closed only" : ""})`,
    ...rows.map(formatCallLine),
  ].join("\n");
}

async function fetchCommunityCallFacts(
  question: string,
  range: HelpDateRange | null
): Promise<string | null> {
  const closedOnly = wantsClosedCalls(question) || /\b(highest|best|top)\b/i.test(question);

  if (isDemoMode()) {
    let calls = getDemoCallsFeed("performing") as unknown as CallRow[];
    if (range) {
      calls = calls.filter((c) =>
        closedOnly ? inClosedRange(c, range) : inCalledRange(c, range)
      );
    } else if (closedOnly) {
      calls = calls.filter((c) => c.closed_at);
    }
    const sorted = [...calls].sort(
      (a, b) => (b.return_pct ?? -Infinity) - (a.return_pct ?? -Infinity)
    );
    const top = sorted.slice(0, 5);
    const label = range ? range.label : "all time";
    if (top.length === 0) {
      return `### Community calls (${label})\n- No matching community calls in demo data.`;
    }
    return [
      `### Community calls (${label}${closedOnly ? ", closed only" : ""})`,
      ...top.map(formatCallLine),
    ].join("\n");
  }

  const db = createServiceClient();
  let query = db
    .from("calls")
    .select(
      "symbol, direction, return_pct, closed_at, called_at, users!inner(username, display_name, subscription_status)"
    )
    .eq("users.subscription_status", "active");

  if (range) {
    const col = closedOnly ? "closed_at" : "called_at";
    query = query
      .gte(col, range.start.toISOString())
      .lt(col, range.end.toISOString());
    if (closedOnly) query = query.not("closed_at", "is", null);
  } else if (closedOnly) {
    query = query.not("closed_at", "is", null);
  }

  const { data, error } = await query
    .order("return_pct", { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) {
    console.error("[help-data-facts community]", error);
    return "### Community calls\n- Could not load community call data right now.";
  }

  const rows = (data ?? []).map(normalizeCallRow);
  const label = range ? range.label : "all time";
  if (rows.length === 0) {
    return `### Community calls (${label}${closedOnly ? ", closed only" : ""})\n- No matching closed calls from active members for that period.`;
  }

  return [
    `### Community calls (${label}${closedOnly ? ", closed only" : ""})`,
    ...rows.map(formatCallLine),
  ].join("\n");
}

export async function buildHelpDataFactsBlock(
  userId: string,
  question: string
): Promise<string | null> {
  if (!questionLooksDataRelated(question)) return null;

  const range = parseHelpQuestionDateRange(question);
  const wantsCommunity = questionMentionsCommunityData(question);
  const wantsUser = questionMentionsUserData(question);

  const blocks: string[] = [];

  if (wantsUser || !wantsCommunity) {
    const userBlock = await fetchUserCallFacts(userId, question, range);
    if (userBlock) blocks.push(userBlock);
  }

  if (wantsCommunity || /\b(community|highest|best|top)\b/i.test(question)) {
    const communityBlock = await fetchCommunityCallFacts(question, range);
    if (communityBlock) blocks.push(communityBlock);
  }

  if (blocks.length === 0) return null;

  return [
    "## LIVE PLATFORM DATA (queried for this question — prefer these facts over guessing)",
    "Only cite numbers listed here. If a section says no matching calls, tell the user clearly.",
    ...blocks,
  ].join("\n\n");
}
