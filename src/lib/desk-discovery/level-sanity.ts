import { suggestDeskLevels } from "@/lib/ai/fueled-analysis-format";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import {
  discoveryDraftSchema,
  parseLevelNote,
  type DiscoveryDraftPayload,
} from "@/lib/desk-discovery/draft-types";

/** Max drift from anchor price before we treat a level as bad data. */
export const DISCOVERY_MAX_ENTRY_DRIFT = 0.35;

export function levelDrift(level: number, anchor: number): number {
  if (anchor <= 0) return Infinity;
  return Math.abs(level - anchor) / anchor;
}

export function isLevelNearPrice(
  level: number,
  anchor: number,
  maxDrift = DISCOVERY_MAX_ENTRY_DRIFT
): boolean {
  return levelDrift(level, anchor) <= maxDrift;
}

function roundLevel(price: number): number {
  if (price >= 100) return Math.round(price * 100) / 100;
  if (price >= 10) return Math.round(price * 100) / 100;
  if (price >= 1) return Math.round(price * 1000) / 1000;
  return Math.round(price * 10000) / 10000;
}

export function formatLevelPrice(value: number, suffix?: string): string {
  const formatted = value >= 100 ? value.toFixed(2) : value >= 10 ? value.toFixed(2) : value.toFixed(4);
  return suffix ? `$${formatted} ${suffix}` : `$${formatted}`;
}

export function levelsAligned(
  direction: "long" | "short",
  entry: number,
  target: number,
  stop: number
): boolean {
  if (direction === "long") return target > entry && stop < entry;
  return target < entry && stop > entry;
}

export function sanitizeDiscoveryDraft(
  draft: DiscoveryDraftPayload,
  lastPrice: number | undefined
): DiscoveryDraftPayload {
  if (lastPrice == null || !Number.isFinite(lastPrice) || lastPrice <= 0) {
    return draft;
  }

  const direction = draft.direction;
  const anchor = roundLevel(lastPrice);
  let entry = parseLevelNote(draft.entryNote);
  let target = parseLevelNote(draft.targetNote);
  let stop = parseLevelNote(draft.stopNote);

  if (entry == null || !isLevelNearPrice(entry, anchor)) {
    entry = anchor;
  }

  const suggested = suggestDeskLevels(entry, direction);

  if (target == null || !isLevelNearPrice(target, entry, 0.5) || !levelsAligned(direction, entry, target, stop ?? entry)) {
    target = suggested.target;
  }
  if (stop == null || !isLevelNearPrice(stop, entry, 0.25) || !levelsAligned(direction, entry, target, stop)) {
    stop = suggested.stop;
  }

  if (!levelsAligned(direction, entry, target, stop)) {
    target = suggested.target;
    stop = suggested.stop;
  }

  return discoveryDraftSchema.parse({
    ...draft,
    entryNote: formatLevelPrice(entry),
    targetNote: formatLevelPrice(target, "target"),
    stopNote: formatLevelPrice(stop, "stop"),
  });
}

export function sanitizeAnalysisLevels(
  analysis: TickerAnalyzeResult,
  lastPrice: number | undefined
): TickerAnalyzeResult {
  if (lastPrice == null || !Number.isFinite(lastPrice) || lastPrice <= 0) {
    return analysis;
  }

  const direction = analysis.direction ?? "long";
  const anchor = roundLevel(lastPrice);
  let entryPrice = analysis.entryPrice;
  let targetPrice = analysis.targetPrice;
  let stopPrice = analysis.stopPrice;

  if (entryPrice == null || !isLevelNearPrice(entryPrice, anchor)) {
    entryPrice = anchor;
  }

  const suggested = suggestDeskLevels(entryPrice, direction);

  if (
    targetPrice == null ||
    !isLevelNearPrice(targetPrice, entryPrice, 0.5) ||
    !levelsAligned(direction, entryPrice, targetPrice, stopPrice ?? entryPrice)
  ) {
    targetPrice = suggested.target;
  }
  if (
    stopPrice == null ||
    !isLevelNearPrice(stopPrice, entryPrice, 0.25) ||
    !levelsAligned(direction, entryPrice, targetPrice, stopPrice)
  ) {
    stopPrice = suggested.stop;
  }

  return {
    ...analysis,
    direction,
    entryPrice,
    targetPrice,
    stopPrice,
  };
}

export type DiscoveryPublishLevels = {
  entry: number;
  target: number;
  stop: number;
};

export function validateDiscoveryPublishLevels(input: {
  direction: "long" | "short";
  entry: number;
  target: number;
  stop: number;
  lastPrice: number;
}): { ok: true; levels: DiscoveryPublishLevels } | { ok: false; error: string } {
  const { direction, entry, target, stop, lastPrice } = input;

  if (!Number.isFinite(entry) || entry <= 0) {
    return { ok: false, error: "invalid_entry" };
  }
  if (!isLevelNearPrice(entry, lastPrice, DISCOVERY_MAX_ENTRY_DRIFT)) {
    return { ok: false, error: "entry_far_from_market" };
  }
  if (!levelsAligned(direction, entry, target, stop)) {
    return { ok: false, error: "levels_misaligned" };
  }

  return { ok: true, levels: { entry, target, stop } };
}

export function draftToPublishLevels(draft: DiscoveryDraftPayload): {
  entry: number | null;
  target: number | null;
  stop: number | null;
} {
  return {
    entry: parseLevelNote(draft.entryNote),
    target: parseLevelNote(draft.targetNote),
    stop: parseLevelNote(draft.stopNote),
  };
}
