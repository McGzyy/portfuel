import type { FueledTrackRecord } from "@/lib/fueled/track-record";

/** Minimum closed Fueled calls before showing win rate / avg return aggregates. */
export const MIN_CLOSED_FOR_AGGREGATE_STATS = 3;

export type FueledTrackRecordDisplay = {
  showAggregateStats: boolean;
  statusNote: string | null;
  avgReturnPct: number | null;
  winRate: number | null;
  bestSymbol: string | null;
  bestReturnPct: number | null;
  openAvgReturnPct: number | null;
};

export function displayFueledTrackRecord(record: FueledTrackRecord): FueledTrackRecordDisplay {
  const showAggregateStats = record.closedCalls >= MIN_CLOSED_FOR_AGGREGATE_STATS;

  return {
    showAggregateStats,
    statusNote: showAggregateStats
      ? null
      : record.closedCalls === 0
        ? "Building track record — stats unlock after closed calls."
        : `${record.closedCalls} closed · need ${MIN_CLOSED_FOR_AGGREGATE_STATS} for win rate & avg return.`,
    avgReturnPct: showAggregateStats ? record.avgReturnPct : null,
    winRate: showAggregateStats ? record.winRate : null,
    bestSymbol: record.bestSymbol,
    bestReturnPct: record.bestReturnPct,
    openAvgReturnPct: record.openAvgReturnPct,
  };
}
