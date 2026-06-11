import type { FeedFilter } from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import { buildFeedHref } from "@/lib/dashboard/nav";

const STORAGE_KEY = "pf_feed_saved_filters";
export const SAVED_FEED_PRESET_LIMIT = 6;

export type SavedFeedPreset = {
  id: string;
  name: string;
  filter: FeedFilter;
  tab: FeedTab;
  q?: string;
  newSince?: boolean;
  savedAt: number;
};

const FILTER_LABELS: Record<FeedFilter, string> = {
  all: "All members",
  fueled: "Fueled desk",
  following: "Following",
  equity: "Stocks",
  crypto: "Crypto",
};

const TAB_LABELS: Record<FeedTab, string> = {
  latest: "Latest",
  performing: "Performing",
  progress: "Near target",
};

export function isDefaultFeedView(opts: {
  filter: FeedFilter;
  tab: FeedTab;
  q?: string;
  newSince?: boolean;
}): boolean {
  return (
    opts.filter === "all" &&
    opts.tab === "latest" &&
    !opts.q?.trim() &&
    !opts.newSince
  );
}

export function suggestFeedPresetName(opts: {
  filter: FeedFilter;
  tab: FeedTab;
  q?: string;
  newSince?: boolean;
}): string {
  const parts: string[] = [];
  if (opts.filter !== "all") parts.push(FILTER_LABELS[opts.filter]);
  if (opts.tab !== "latest") parts.push(TAB_LABELS[opts.tab]);
  if (opts.newSince) parts.push("New only");
  if (opts.q?.trim()) parts.push(`"${opts.q.trim().slice(0, 24)}"`);
  return parts.join(" · ") || "My feed view";
}

export function presetHref(preset: SavedFeedPreset): string {
  return buildFeedHref({
    tab: preset.tab === "latest" ? undefined : preset.tab,
    filter: preset.filter === "all" ? undefined : preset.filter,
    q: preset.q,
    newSince: preset.newSince,
  });
}

export function readSavedFeedPresets(): SavedFeedPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedFeedPreset[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p) =>
          p &&
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.filter === "string"
      )
      .slice(0, SAVED_FEED_PRESET_LIMIT);
  } catch {
    return [];
  }
}

export function writeSavedFeedPresets(presets: SavedFeedPreset[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(presets.slice(0, SAVED_FEED_PRESET_LIMIT))
  );
}

export function viewMatchesPreset(
  preset: SavedFeedPreset,
  view: { filter: FeedFilter; tab: FeedTab; q?: string; newSince?: boolean }
): boolean {
  return (
    preset.filter === view.filter &&
    preset.tab === view.tab &&
    (preset.q ?? "") === (view.q?.trim() ?? "") &&
    Boolean(preset.newSince) === Boolean(view.newSince)
  );
}

/** Short human-readable description for tooltips and empty states. */
export function savedFeedPresetSummary(preset: SavedFeedPreset): string {
  const parts: string[] = [];
  parts.push(FILTER_LABELS[preset.filter]);
  parts.push(TAB_LABELS[preset.tab]);
  if (preset.newSince) parts.push("New only");
  if (preset.q?.trim()) parts.push(`Search “${preset.q.trim()}”`);
  return parts.join(" · ");
}
