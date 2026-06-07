import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { WatchlistDigestSymbolContext } from "@/lib/ai/watchlist-digest-types";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import { getDemoJournalEntries } from "@/lib/watchlist/journal-demo";
import { outcomeLabel } from "@/lib/watchlist/journal-meta";
import { enrichWatchlistIntelSnippets } from "@/lib/watchlist/intel-snippets";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const MAX_SYMBOLS = 12;

function fmtShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function pickSymbols(items: WatchlistEntry[]): WatchlistEntry[] {
  return [...items]
    .sort((a, b) => {
      const moveA = Math.abs(a.change_since_add_pct ?? 0);
      const moveB = Math.abs(b.change_since_add_pct ?? 0);
      if (moveB !== moveA) return moveB - moveA;
      const readyA = a.journal_progress?.ready_to_publish ? 1 : 0;
      const readyB = b.journal_progress?.ready_to_publish ? 1 : 0;
      return readyB - readyA;
    })
    .slice(0, MAX_SYMBOLS);
}

async function recentEntriesBySymbol(
  userId: string,
  symbols: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (symbols.length === 0) return map;

  if (isDemoMode()) {
    for (const sym of symbols) {
      const entries = getDemoJournalEntries(sym)
        .slice(-2)
        .map((e) => e.body.trim())
        .filter(Boolean);
      if (entries.length) map.set(sym, entries);
    }
    return map;
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("watchlist_journal_entries")
    .select("symbol, body, created_at")
    .eq("user_id", userId)
    .in("symbol", symbols)
    .neq("entry_type", "system")
    .order("created_at", { ascending: false });

  if (error) throw error;

  for (const row of data ?? []) {
    const sym = (row as { symbol: string }).symbol.toUpperCase();
    const body = ((row as { body: string }).body ?? "").trim();
    if (!body) continue;
    const list = map.get(sym) ?? [];
    if (list.length >= 2) continue;
    list.push(body.slice(0, 280));
    map.set(sym, list);
  }

  return map;
}

export async function buildWatchlistDigestContext(
  userId: string,
  items: WatchlistEntry[]
): Promise<WatchlistDigestSymbolContext[]> {
  if (items.length === 0) return [];

  const picked = pickSymbols(items);
  const withIntel = await enrichWatchlistIntelSnippets(picked);
  const symbols = withIntel.map((i) => i.symbol);
  const [entriesMap, earningsRows] = await Promise.all([
    recentEntriesBySymbol(userId, symbols),
    fetchEarningsForSymbols(
      symbols.filter(
        (s) => withIntel.find((i) => i.symbol === s)?.asset_class === "equity"
      ),
      14
    ),
  ]);

  const earningsBySymbol = new Map<string, string>();
  for (const row of earningsRows) {
    if (!earningsBySymbol.has(row.symbol)) {
      const hour = row.hour?.toUpperCase() ?? "";
      earningsBySymbol.set(
        row.symbol,
        `Reports ${fmtShortDate(row.date)}${hour ? ` ${hour}` : ""}`
      );
    }
  }

  return withIntel.map((item) => {
    const progress = item.journal_progress;
    let journalProgress: string | null = null;
    if (progress) {
      journalProgress = `${progress.required_completed}/${progress.required_total} research steps${
        progress.ready_to_publish ? " · ready to publish" : ""
      }`;
    }

    const intelEarnings = item.intel_snippet?.next_earnings_date
      ? `Reports ${fmtShortDate(item.intel_snippet.next_earnings_date)}`
      : null;

    return {
      symbol: item.symbol,
      asset_class: item.asset_class,
      change_since_add_pct: item.change_since_add_pct ?? null,
      last_price: item.last_price ?? null,
      conviction: item.conviction ?? null,
      outcome: item.outcome ? outcomeLabel(item.outcome) : null,
      thesis_snippet: item.thesis?.trim().slice(0, 200) ?? null,
      catalysts: item.catalysts ?? [],
      journal_progress: journalProgress,
      earnings: earningsBySymbol.get(item.symbol) ?? intelEarnings,
      headlines_7d: item.intel_snippet?.news_headline_count_7d ?? null,
      recent_entries: entriesMap.get(item.symbol) ?? [],
    };
  });
}

export function formatWatchlistDigestPrompt(context: WatchlistDigestSymbolContext[]): string {
  if (context.length === 0) {
    return "The member has an empty watchlist.";
  }

  return context
    .map((c) => {
      const lines = [
        `Symbol: ${c.symbol} (${c.asset_class})`,
        c.change_since_add_pct != null
          ? `Move since add: ${c.change_since_add_pct >= 0 ? "+" : ""}${c.change_since_add_pct.toFixed(2)}%`
          : null,
        c.last_price != null ? `Last price: ${c.last_price}` : null,
        c.conviction != null ? `Conviction: ${c.conviction}/10` : null,
        c.outcome ? `Outcome tag: ${c.outcome}` : null,
        c.thesis_snippet ? `Thesis: ${c.thesis_snippet}` : "Thesis: (none yet)",
        c.catalysts.length ? `Catalysts: ${c.catalysts.join(", ")}` : null,
        c.journal_progress ? `Journal: ${c.journal_progress}` : null,
        c.earnings ? `Earnings: ${c.earnings}` : null,
        c.headlines_7d != null ? `Headlines (7d): ${c.headlines_7d}` : null,
        c.recent_entries.length
          ? `Recent notes:\n${c.recent_entries.map((e, i) => `  ${i + 1}. ${e}`).join("\n")}`
          : "Recent notes: none",
      ].filter(Boolean);

      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

export const DEMO_WATCHLIST_DIGEST = {
  headline: "NVDA leads your book — earnings and journal work align this week",
  summary:
    "Your watchlist is tilted toward AI leaders with meaningful price drift since add. NVDA shows the strongest move and has a complete research checklist — worth deciding whether to publish or log a post-earnings update. AMD remains in develop mode with MI300 thesis intact but lighter timeline activity. BTC is range-bound; your journal note flags ETF flow as the gating catalyst.",
  highlights: [
    {
      symbol: "NVDA",
      headline: "Largest mover + earnings soon",
      detail:
        "Up double digits since add with a full thesis and plan. Earnings on deck — reconcile your journal plan before the print.",
    },
    {
      symbol: "AMD",
      headline: "Thesis set, timeline quiet",
      detail:
        "Inference share narrative unchanged. Consider logging a price-action note if MI300 headlines accelerate.",
    },
    {
      symbol: "BTC",
      headline: "Range trade watch",
      detail:
        "ETF inflow thesis still valid. No new journal entries — update if $70k breaks.",
    },
  ],
};
