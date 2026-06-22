import type { ChartAvatarEmblemKind } from "@/components/charts/ChartAvatarEmblem";
import type { ChartAvatarPin } from "@/components/charts/ChartAvatarOverlay";
import type { ChartMarker, ChartMemberAvatar, ReturnChartPoint } from "@/lib/charts/types";
import { collapseDayCallMarkers } from "@/lib/charts/marker-clusters";

function markerKindToEmblem(kind?: ChartMarker["kind"]): ChartAvatarEmblemKind {
  if (kind === "fueled") return "fueled";
  if (kind === "short") return "short";
  if (kind === "journal") return "journal";
  return "long";
}

function outcomeToEmblem(outcome?: ReturnChartPoint["outcome"]): ChartAvatarEmblemKind {
  if (outcome === "win") return "win";
  if (outcome === "loss") return "loss";
  if (outcome === "flat") return "flat";
  return "long";
}

/** Collapsed call markers as avatar pins for the ticker chart overlay. */
export function tickerMarkersToAvatarPins(markers: ChartMarker[]): ChartAvatarPin[] {
  const collapsed = collapseDayCallMarkers(markers.filter((m) => m.callId));
  return collapsed.map((m) => ({
    time: m.time,
    price: m.price,
    username: m.username ?? "member",
    displayName: m.displayName,
    avatarUrl: m.avatarUrl,
    kind: markerKindToEmblem(m.kind),
    clusterCount: m.clusterCount,
    callId: m.callId,
    placement:
      m.kind === "long" ? "below" : m.kind === "short" || m.kind === "fueled" ? "above" : "on",
  }));
}

/** Track-record points — symbol logos by default (all calls are from one member). */
export function returnPointsToAvatarPins(
  points: ReturnChartPoint[],
  member?: ChartMemberAvatar | null,
  options?: { emblem?: "member" | "symbol"; symbolKind?: ChartAvatarEmblemKind }
): ChartAvatarPin[] {
  const emblem = options?.emblem ?? "symbol";
  return points
    .filter((p) => p.isCallMarker && p.symbol && (emblem === "symbol" || p.outcome != null))
    .map((p) => ({
      time: p.time,
      price: p.value,
      username: p.username ?? member?.username ?? "member",
      displayName: p.displayName ?? member?.displayName,
      avatarUrl: p.avatarUrl ?? member?.avatarUrl ?? null,
      symbol: p.symbol,
      assetClass: p.assetClass,
      emblem,
      kind:
        emblem === "symbol" && options?.symbolKind
          ? options.symbolKind
          : outcomeToEmblem(p.outcome),
      callId: p.callId,
      placement: "on" as const,
    }));
}
