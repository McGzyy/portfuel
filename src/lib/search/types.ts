import type { AssetClass } from "@/lib/market/validate-symbol";

export type SearchSymbolResult = {
  symbol: string;
  assetClass: AssetClass;
  name?: string;
  onWatchlist: boolean;
  href: string;
  /** Intel page when journal is primary (watchlisted). */
  intelHref: string;
  lastPrice?: number | null;
};

export type SearchMemberResult = {
  username: string;
  displayName: string | null;
  href: string;
};

export type SearchPageResult = {
  label: string;
  description: string;
  href: string;
};

export type SearchHeadlineResult = {
  id: number;
  headline: string;
  source: string;
  url: string;
  datetime: number;
  relatedSymbols: string[];
};

export type SearchJournalEntryResult = {
  id: string;
  symbol: string;
  body: string;
  entryType: string;
  entryTypeLabel: string;
  createdAt: string;
  href: string;
};

export type SearchCallResult = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  thesis: string;
  authorLabel: string;
  calledAt: string;
  href: string;
};

export type WorkspaceSearchResults = {
  query: string;
  /** Populated when the query is empty and the client sends recent symbols. */
  recent: SearchSymbolResult[];
  symbols: SearchSymbolResult[];
  journalEntries: SearchJournalEntryResult[];
  calls: SearchCallResult[];
  members: SearchMemberResult[];
  pages: SearchPageResult[];
  headlines: SearchHeadlineResult[];
};

export type RecentTickerStored = {
  symbol: string;
  assetClass: AssetClass;
  searchedAt: number;
};
