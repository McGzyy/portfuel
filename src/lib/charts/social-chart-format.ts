import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";

export function fmtSocialAsOf(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function directionMeta(direction: "long" | "short"): { label: string; color: string } {
  return direction === "long"
    ? { label: "Long", color: T.lineUp }
    : { label: "Short", color: T.lineDown };
}

export function extractCallLevels(payload: SocialChartPayload): {
  entry: number | null;
  target: number | null;
  stop: number | null;
} {
  const find = (kind: "entry" | "target" | "stop") => {
    const desk = payload.priceLines.find((l) => new RegExp(`desk.*${kind}`, "i").test(l.label));
    const line = desk ?? payload.priceLines.find((l) => new RegExp(kind, "i").test(l.label));
    return line?.price ?? null;
  };
  const marker =
    payload.markers.find((m) => m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled");
  return {
    entry: find("entry") ?? marker?.price ?? null,
    target: find("target"),
    stop: find("stop"),
  };
}

export function isFreshPublishChart(payload: SocialChartPayload): boolean {
  if (payload.milestone) return false;
  const ret = payload.returnPct;
  return ret == null || Math.abs(ret) < 0.2;
}

export function plannedMovePct(
  entry: number,
  target: number,
  direction: "long" | "short"
): number {
  if (entry <= 0 || target <= 0) return 0;
  const raw = direction === "long" ? (target - entry) / entry : (entry - target) / entry;
  return raw * 100;
}

export function formatUsdCompact(value: number): string {
  return value >= 10
    ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${value.toFixed(4)}`;
}

export type SocialChartHeaderMetric = {
  value: string;
  label: string;
  color: string;
};

/** Right-rail stat: milestone return, planned upside on fresh publish, or live return. */
export function headerMetricForSocialChart(payload: SocialChartPayload): SocialChartHeaderMetric | null {
  const { entry, target } = extractCallLevels(payload);
  const ret = payload.returnPct;
  const up = (ret ?? 0) >= 0;
  const trendColor = up ? T.lineUp : T.lineDown;
  const sinceLabel =
    payload.spotlightKind === "member" ? "SINCE PUBLICATION" : "SINCE DESK CALL";

  if (isFreshPublishChart(payload) && entry != null && target != null) {
    const move = plannedMovePct(entry, target, payload.direction);
    if (Math.abs(move) >= 0.5) {
      return {
        value: `${move >= 0 ? "+" : ""}${move.toFixed(1)}%`,
        label: "PLANNED TO TARGET",
        color: move >= 0 ? T.lineUp : T.lineDown,
      };
    }
    if (entry > 0) {
      return {
        value: formatUsdCompact(entry),
        label: "ENTRY",
        color: T.textBright,
      };
    }
  }

  if (ret != null) {
    return {
      value: `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`,
      label: sinceLabel,
      color: trendColor,
    };
  }

  return null;
}

export function levelsSummaryLine(payload: SocialChartPayload): string | null {
  const { entry, target, stop } = extractCallLevels(payload);
  const parts: string[] = [];
  if (entry != null) parts.push(`Entry ${formatUsdCompact(entry)}`);
  if (target != null) parts.push(`Target ${formatUsdCompact(target)}`);
  if (stop != null) parts.push(`Stop ${formatUsdCompact(stop)}`);
  return parts.length > 0 ? parts.join("  ·  ") : null;
}

export function showTargetGuide(
  milestone: CallMilestoneKey | null,
  hasTarget: boolean,
  freshPublish = false
): boolean {
  if (milestone === "target_reached" || milestone === "return_25") return true;
  if (freshPublish && hasTarget) return true;
  return false;
}

export function showStopGuide(
  milestone: CallMilestoneKey | null,
  hasStop: boolean,
  freshPublish = false
): boolean {
  if (milestone) return false;
  return freshPublish && hasStop;
}
