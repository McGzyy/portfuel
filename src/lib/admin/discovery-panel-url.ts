import type { DiscoverySortMode } from "@/lib/desk-discovery/candidate-sort";

export type DiscoveryPanelFilter =
  | "inbox"
  | "ready"
  | "published"
  | "snoozed"
  | "rejected";

const FILTERS = new Set<DiscoveryPanelFilter>([
  "inbox",
  "ready",
  "published",
  "snoozed",
  "rejected",
]);

const SORTS = new Set<DiscoverySortMode>(["score", "earnings", "symbol"]);

export function parseDiscoveryFilter(raw: string | null): DiscoveryPanelFilter {
  if (raw && FILTERS.has(raw as DiscoveryPanelFilter)) return raw as DiscoveryPanelFilter;
  return "inbox";
}

export function parseDiscoverySort(raw: string | null): DiscoverySortMode {
  if (raw && SORTS.has(raw as DiscoverySortMode)) return raw as DiscoverySortMode;
  return "score";
}

export function buildDiscoveryAdminUrl(opts: {
  filter?: DiscoveryPanelFilter;
  sort?: DiscoverySortMode;
  id?: string | null;
  highPriority?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set("tab", "discovery");
  if (opts.filter && opts.filter !== "inbox") params.set("filter", opts.filter);
  if (opts.sort && opts.sort !== "score") params.set("sort", opts.sort);
  if (opts.id) params.set("id", opts.id);
  if (opts.highPriority) params.set("hp", "1");
  return `/admin?${params.toString()}`;
}
