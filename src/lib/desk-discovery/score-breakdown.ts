import type { DiscoveryReason, DiscoverySignalType } from "@/lib/desk-discovery/types";
import { MULTI_SIGNAL_BONUS, SIGNAL_WEIGHTS } from "@/lib/desk-discovery/config";

export type DiscoveryScoreLine = {
  label: string;
  points: number;
};

const LINE_LABELS: Record<string, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
  community_heat: "Community",
  recent_filing: "Filing",
};

export function buildScoreBreakdown(
  signalTypes: DiscoverySignalType[],
  reasons?: DiscoveryReason[]
): DiscoveryScoreLine[] {
  if (reasons?.length) {
    return reasons.map((r) => ({
      label: r.detail.includes("independent")
        ? "Multi-signal"
        : r.detail.includes("+")
          ? r.detail
          : (LINE_LABELS[r.type] ?? r.type.replace(/_/g, " ")),
      points: r.points ?? SIGNAL_WEIGHTS[r.type as DiscoverySignalType] ?? 0,
    }));
  }

  const lines: DiscoveryScoreLine[] = signalTypes.map((type) => ({
    label: LINE_LABELS[type] ?? type.replace(/_/g, " "),
    points: SIGNAL_WEIGHTS[type],
  }));

  if (signalTypes.length >= 2) {
    lines.push({ label: "Multi-signal", points: MULTI_SIGNAL_BONUS });
  }

  return lines;
}

export function scoreFromBreakdown(lines: DiscoveryScoreLine[]): number {
  return lines.reduce((sum, line) => sum + line.points, 0);
}
