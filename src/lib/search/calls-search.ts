import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { snippetAroundMatch } from "@/lib/search/highlight";
import type { SearchCallResult } from "@/lib/search/types";

const CALL_LIMIT = 5;
const MIN_QUERY_LEN = 2;

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function mapCall(
  row: {
    id: string;
    symbol: string;
    direction: "long" | "short";
    thesis: string;
    called_at: string;
    authorLabel: string;
  },
  query: string
): SearchCallResult {
  return {
    id: row.id,
    symbol: row.symbol.toUpperCase(),
    direction: row.direction,
    thesis: snippetAroundMatch(row.thesis.trim(), query),
    authorLabel: row.authorLabel,
    calledAt: row.called_at,
    href: `/ticker/${encodeURIComponent(row.symbol.toUpperCase())}#thesis-${encodeURIComponent(row.id)}`,
  };
}

function searchDemoCalls(query: string): SearchCallResult[] {
  const q = query.trim().toLowerCase();
  return getDemoCallsFeed("latest")
    .filter((call) => call.thesis.toLowerCase().includes(q))
    .slice(0, CALL_LIMIT)
    .map((call) =>
      mapCall(
        {
          id: call.id,
          symbol: call.symbol,
          direction: call.direction,
          thesis: call.thesis,
          called_at: call.called_at,
          authorLabel: call.users.display_name ?? call.users.username ?? "Member",
        },
        query
      )
    );
}

export async function searchMemberCalls(query: string): Promise<SearchCallResult[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LEN) return [];

  if (isDemoMode()) return searchDemoCalls(q);

  const db = createServiceClient();
  const pattern = `%${escapeIlike(q)}%`;
  const { data, error } = await db
    .from("calls")
    .select(
      "id, symbol, direction, thesis, called_at, users!inner(username, display_name, subscription_status)"
    )
    .eq("users.subscription_status", "active")
    .ilike("thesis", pattern)
    .order("called_at", { ascending: false })
    .limit(CALL_LIMIT);

  if (error) {
    console.error("[search/calls]", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      symbol: string;
      direction: "long" | "short";
      thesis: string;
      called_at: string;
      users: { username: string; display_name: string | null };
    };
    return mapCall(
      {
        id: r.id,
        symbol: r.symbol,
        direction: r.direction,
        thesis: r.thesis,
        called_at: r.called_at,
        authorLabel: r.users.display_name ?? r.users.username,
      },
      q
    );
  });
}
