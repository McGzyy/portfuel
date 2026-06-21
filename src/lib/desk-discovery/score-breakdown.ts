import { MULTI_SIGNAL_BONUS, SIGNAL_WEIGHTS } from "@/lib/desk-discovery/config";
import type { DiscoverySignalType } from "@/lib/desk-discovery/types";

export type DiscoveryScoreLine = {
  label: string;
  points: number;
};

export function buildScoreBreakdown(signalTypes: DiscoverySignalType[]): DiscoveryScoreLine[] {
  const lines: DiscoveryScoreLine[] = signalTypes.map((type) => ({
    label: type.replace(/_/g, " "),
    points: SIGNAL_WEIGHTS[type],
  }));

  if (signalTypes.length >= 2) {
    lines.push({ label: "Multi-signal bonus", points: MULTI_SIGNAL_BONUS });
  }

  return lines;
}

export function scoreFromBreakdown(lines: DiscoveryScoreLine[]): number {
  return lines.reduce((sum, line) => sum + line.points, 0);
}
