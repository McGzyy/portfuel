/** Signal types active in the free/lite tier. */
export type DiscoverySignalType =
  | "earnings_soon"
  | "news_catalyst"
  | "volume_anomaly"
  | "price_move"
  | "crypto_momentum";

/** Paid-tier signal types — wired via provider plugins when subscribed. */
export type PaidDiscoverySignalType =
  | "fmp_screener"
  | "polygon_unusual"
  | "options_flow";

export type DiscoveryAssetClass = "equity" | "crypto";

export type DiscoveryCandidateStatus =
  | "pending"
  | "snoozed"
  | "rejected"
  | "approved"
  | "published";

export type DiscoveryReason = {
  type: DiscoverySignalType | PaidDiscoverySignalType;
  detail: string;
};

export type RawDiscoveryHit = {
  symbol: string;
  assetClass: DiscoveryAssetClass;
  type: DiscoverySignalType;
  detail: string;
  weight?: number;
};

export type ScoredDiscoveryCandidate = {
  symbol: string;
  assetClass: DiscoveryAssetClass;
  score: number;
  signalTypes: DiscoverySignalType[];
  reasons: DiscoveryReason[];
  headline: string;
};

export type DiscoveryCandidateRow = {
  id: string;
  symbol: string;
  assetClass: DiscoveryAssetClass;
  score: number;
  signalTypes: DiscoverySignalType[];
  reasons: DiscoveryReason[];
  headline: string | null;
  status: DiscoveryCandidateStatus;
  snoozedUntil: string | null;
  publishedCallId: string | null;
  scanRunId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
};

export type DiscoveryScanSummary = {
  scanRunId: string;
  scannedAt: string;
  hitsFound: number;
  upserted: number;
  skippedExisting: number;
  saveErrors: string[];
  notifiedAdmins: number;
  skippedExcluded: number;
  equityBatchSize: number;
  equityRotationOffset: number;
  signals: Partial<Record<DiscoverySignalType, number>>;
  providerTier: "lite" | "paid";
};
