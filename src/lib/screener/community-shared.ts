export type MostCalledRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  callCount: number;
  latestDirection: string;
  bestReturnPct: number | null;
};

export type TopReturnRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: string;
  return_pct: number;
  called_at: string;
  username: string;
  display_name: string | null;
};

export type TargetProgressRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: string;
  target_progress: number;
  return_pct: number | null;
  username: string;
  called_at: string;
};

export type DeskVsCrowdRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  communityLongPct: number;
  communityCalls: number;
  deskDirection: "long" | "short" | null;
  diverges: boolean;
  bestReturnPct: number | null;
};

export type ConvictionRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  voteScore: number;
  callCount: number;
  latestDirection: string;
  bestReturnPct: number | null;
};

export type CommunityScreenerData = {
  mostCalled: MostCalledRow[];
  topReturns: TopReturnRow[];
  targetProgress: TargetProgressRow[];
  deskVsCrowd: DeskVsCrowdRow[];
  highConviction: ConvictionRow[];
};

export type ScreenerAssetFilter = "all" | "equity" | "crypto";

export function filterScreenerByAsset(
  data: CommunityScreenerData,
  filter: ScreenerAssetFilter
): CommunityScreenerData {
  if (filter === "all") return data;
  const match = (row: { asset_class: "equity" | "crypto" }) => row.asset_class === filter;
  return {
    mostCalled: data.mostCalled.filter(match),
    topReturns: data.topReturns.filter(match),
    targetProgress: data.targetProgress.filter(match),
    deskVsCrowd: data.deskVsCrowd.filter(match),
    highConviction: data.highConviction.filter(match),
  };
}
