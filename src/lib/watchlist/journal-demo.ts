import type { WatchlistJournal, WatchlistJournalEntry } from "@/lib/watchlist/journal-types";
import type { JournalEntryStats } from "@/lib/journal/hub-summary";

const DEMO_SYMBOLS = new Set(["NVDA", "AMD", "SPY", "BTC"]);

export function isDemoJournalSymbol(symbol: string): boolean {
  return DEMO_SYMBOLS.has(symbol.toUpperCase());
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

function demoJournal(symbol: string): WatchlistJournal | null {
  const sym = symbol.toUpperCase();
  const base = {
    created_at: daysAgo(14),
    baseline_price: null as number | null,
    last_price: null as number | null,
    journal_updated_at: daysAgo(1),
  };

  switch (sym) {
    case "NVDA":
      return {
        ...base,
        symbol: "NVDA",
        asset_class: "equity",
        baseline_price: 128,
        last_price: 142.5,
        thesis:
          "AI datacenter capex cycle still accelerating — NVDA remains the picks-and-shovels winner as hyperscalers expand GPU clusters through 2026.",
        conviction: 8,
        entry_price: 135,
        stop_price: 118,
        target_price: 165,
        entry_note: "Add on pullback to $135 support; trim into $165 resistance.",
        catalysts: ["Earnings", "Product launch", "AI exposure"],
        risk_factors: "Export controls, customer concentration, multiple compression if capex slows.",
        outcome: "developing",
        bull_case_price: 180,
        base_case_price: 165,
        bear_case_price: 110,
      };
    case "AMD":
      return {
        ...base,
        symbol: "AMD",
        asset_class: "equity",
        baseline_price: 165,
        last_price: 178.2,
        thesis: "MI300 share gains vs NVDA in inference — watching gross margin trajectory post ramp.",
        conviction: 6,
        entry_price: 172,
        target_price: 195,
        catalysts: ["Earnings", "Partnership"],
        risk_factors: "Execution on datacenter GPU roadmap.",
        outcome: "watching",
      };
    case "SPY":
      return {
        ...base,
        symbol: "SPY",
        asset_class: "equity",
        baseline_price: 512,
        last_price: 528.4,
        thesis: null,
        conviction: null,
        entry_price: null,
        target_price: null,
        outcome: "watching",
      };
    case "BTC":
      return {
        ...base,
        symbol: "BTC",
        asset_class: "crypto",
        baseline_price: 64800,
        last_price: 68420,
        thesis: "ETF inflows + halving supply shock — range breakout above $70k would confirm next leg.",
        conviction: 7,
        entry_price: 66000,
        target_price: 78000,
        stop_price: 61000,
        catalysts: ["Fed decision", "Crypto exposure"],
        risk_factors: "Macro risk-off, regulatory headlines.",
        outcome: "watching",
      };
    default:
      return null;
  }
}

function demoEntries(symbol: string): WatchlistJournalEntry[] {
  const sym = symbol.toUpperCase();
  if (sym === "NVDA") {
    return [
      {
        id: "demo-entry-nvda-1",
        body: "Price held $135 support on volume — thesis intact ahead of earnings.",
        entry_type: "price_action",
        metadata: null,
        reply_to_id: null,
        conviction_after: null,
        marker_price: 135,
        created_at: daysAgo(5),
      },
      {
        id: "demo-entry-nvda-2",
        body: "Q4 preview: hyperscaler commentary still bullish on AI spend. Raised conviction to 8.",
        entry_type: "earnings",
        metadata: null,
        reply_to_id: null,
        conviction_after: 8,
        marker_price: 140,
        created_at: daysAgo(2),
      },
      {
        id: "demo-entry-nvda-ai",
        body: "AI research snapshot saved.",
        entry_type: "ai_research",
        metadata: {
          read: "Strong datacenter demand; monitor export policy and customer mix. Catalyst cluster around next earnings.",
          strengths: ["Datacenter GPU leadership", "Hyperscaler capex tailwind"],
          research_gaps: ["Custom silicon share shift"],
          questions_to_answer: ["Will margin expand post Blackwell ramp?"],
          catalyst_notes: ["Next earnings date", "Export policy updates"],
          risk_prompts: ["Valuation vs historical multiples"],
        },
        reply_to_id: null,
        conviction_after: null,
        marker_price: null,
        created_at: daysAgo(1),
      },
    ];
  }
  if (sym === "AMD") {
    return [
      {
        id: "demo-entry-amd-1",
        body: "MI300 adoption headlines — need one more datapoint before sizing up.",
        entry_type: "news",
        metadata: null,
        reply_to_id: null,
        conviction_after: null,
        marker_price: 175,
        created_at: daysAgo(3),
      },
    ];
  }
  if (sym === "BTC") {
    return [
      {
        id: "demo-entry-btc-1",
        body: "ETF flow data positive 5 sessions running.",
        entry_type: "note",
        metadata: null,
        reply_to_id: null,
        conviction_after: null,
        marker_price: 67000,
        created_at: daysAgo(4),
      },
      {
        id: "demo-entry-btc-2",
        body: "Broke above $68k — watching $70k resistance for confirmation.",
        entry_type: "price_action",
        metadata: null,
        reply_to_id: null,
        conviction_after: null,
        marker_price: 68420,
        created_at: daysAgo(1),
      },
    ];
  }
  return [];
}

export function getDemoWatchlistJournal(symbol: string): WatchlistJournal | null {
  return demoJournal(symbol);
}

export function getDemoJournalEntries(symbol: string): WatchlistJournalEntry[] {
  if (!isDemoJournalSymbol(symbol)) return [];
  return demoEntries(symbol);
}

export function getDemoJournalEntryStats(): Record<string, JournalEntryStats> {
  const stats: Record<string, JournalEntryStats> = {};
  for (const sym of DEMO_SYMBOLS) {
    const entries = demoEntries(sym);
    const manualCount = entries.filter((e) =>
      ["note", "price_action", "earnings", "news", "thesis_update"].includes(e.entry_type)
    ).length;
    stats[sym] = {
      manualCount,
      hasAiResearch: entries.some((e) => e.entry_type === "ai_research"),
    };
  }
  return stats;
}
