import type {
  JournalCatalyst,
  JournalEntryType,
  JournalOutcome,
  PositionIntent,
} from "@/lib/watchlist/journal-meta";
import type { JournalResearchSnapshot } from "@/lib/journal/research-entry";

export type WatchlistJournal = {
  symbol: string;
  asset_class: "equity" | "crypto";
  created_at: string;
  baseline_price?: number | null;
  last_price?: number | null;
  thesis?: string | null;
  conviction?: number | null;
  entry_price?: number | null;
  stop_price?: number | null;
  target_price?: number | null;
  entry_note?: string | null;
  catalysts?: JournalCatalyst[];
  risk_factors?: string | null;
  research_followups?: string | null;
  personal_tags?: string[];
  outcome?: JournalOutcome;
  position_intent?: PositionIntent;
  bull_case_price?: number | null;
  base_case_price?: number | null;
  bear_case_price?: number | null;
  journal_updated_at?: string | null;
};

export type WatchlistJournalEntry = {
  id: string;
  body: string;
  entry_type: JournalEntryType;
  metadata: JournalResearchSnapshot | null;
  reply_to_id: string | null;
  conviction_after: number | null;
  marker_price: number | null;
  created_at: string;
};

export type WatchlistJournalPatch = {
  thesis?: string | null;
  conviction?: number | null;
  entry_price?: number | null;
  stop_price?: number | null;
  target_price?: number | null;
  entry_note?: string | null;
  catalysts?: JournalCatalyst[];
  risk_factors?: string | null;
  research_followups?: string | null;
  personal_tags?: string[];
  outcome?: JournalOutcome;
  position_intent?: PositionIntent;
  bull_case_price?: number | null;
  base_case_price?: number | null;
  bear_case_price?: number | null;
};
