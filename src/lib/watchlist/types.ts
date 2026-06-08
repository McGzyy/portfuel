import type { PositionIntent } from "@/lib/watchlist/journal-meta";

export type WatchlistEntry = {
  symbol: string;
  asset_class: "equity" | "crypto";
  created_at: string;
  baseline_price?: number | null;
  last_price?: number | null;
  return_pct?: number | null;
  /** % change from baseline_price to last_price */
  change_since_add_pct?: number | null;
  /** Member calls on this symbol in the last 7 days */
  community_calls_7d?: number;
  /** Unread watchlist_call notification for this symbol */
  has_unread_call_alert?: boolean;
  /** Private journal conviction 1–10 */
  conviction?: number | null;
  /** Whether a private thesis is saved */
  has_thesis?: boolean;
  /** Private journal last update */
  journal_updated_at?: string | null;
  outcome?: string | null;
  /** Private trade posture — researching through trimming/exited */
  position_intent?: PositionIntent;
  /** Member's latest call on this symbol (if any) */
  user_call?: {
    id: string;
    called_at: string;
    return_pct: number | null;
  } | null;
  catalyst_count?: number;
  /** Preset catalyst tags from journal */
  catalysts?: string[];
  /** Journal research checklist progress (watchlist + journal surfaces) */
  journal_progress?: {
    required_completed: number;
    required_total: number;
    ready_to_publish: boolean;
    manual_entry_count: number;
    has_ai_research: boolean;
  };
  /** Private plan fields (journal hub progress) */
  entry_price?: number | null;
  target_price?: number | null;
  risk_factors?: string | null;
  thesis?: string | null;
  /** Pro: per-symbol ±% move threshold; null uses global alert prefs */
  price_alert_pct?: number | null;
  /** Pro: earnings + headline counts for equity rows */
  intel_snippet?: {
    next_earnings_date: string | null;
    next_earnings_hour: string | null;
    news_headline_count_7d: number;
  };
};
