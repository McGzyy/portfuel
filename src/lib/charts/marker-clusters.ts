import type { ChartMarker } from "@/lib/charts/types";
import { candleDayStart } from "@/lib/charts/marker-hit";

const CLUSTER_COLOR = "#6366f1";

/** One visible marker per calendar day; stacks same-day community calls. */
export function collapseDayCallMarkers(markers: ChartMarker[]): ChartMarker[] {
  const journal = markers.filter((m) => m.journalEntryId);
  const calls = markers.filter((m) => m.callId);

  const byDay = new Map<number, ChartMarker[]>();
  for (const m of calls) {
    const day = candleDayStart(m.time);
    const group = byDay.get(day) ?? [];
    group.push(m);
    byDay.set(day, group);
  }

  const collapsed: ChartMarker[] = [];
  for (const group of byDay.values()) {
    if (group.length === 1) {
      collapsed.push(group[0]);
      continue;
    }

    const fueled = group.find((m) => m.kind === "fueled");
    const rep = fueled ?? group[0];
    collapsed.push({
      ...rep,
      label: `${group.length} calls`,
      color: CLUSTER_COLOR,
      kind: fueled ? "fueled" : rep.kind,
      clusterCount: group.length,
    });
  }

  return [...journal, ...collapsed];
}

export function isClusterMarker(m: ChartMarker): boolean {
  return (m.clusterCount ?? 0) > 1;
}
