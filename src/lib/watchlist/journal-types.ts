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
  journal_updated_at?: string | null;
};

export type WatchlistJournalEntry = {
  id: string;
  body: string;
  reply_to_id: string | null;
  conviction_after: number | null;
  created_at: string;
};

export type WatchlistJournalPatch = {
  thesis?: string | null;
  conviction?: number | null;
  entry_price?: number | null;
  stop_price?: number | null;
  target_price?: number | null;
  entry_note?: string | null;
};
