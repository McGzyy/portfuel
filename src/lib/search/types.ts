import type { AssetClass } from "@/lib/market/validate-symbol";

export type SearchSymbolResult = {
  symbol: string;
  assetClass: AssetClass;
  name?: string;
  onWatchlist: boolean;
  href: string;
  /** Intel page when journal is primary (watchlisted). */
  intelHref: string;
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

export type WorkspaceSearchResults = {
  query: string;
  symbols: SearchSymbolResult[];
  members: SearchMemberResult[];
  pages: SearchPageResult[];
};
