import type { WorkspaceSearchResults } from "@/lib/search/types";

const CACHE_MS_QUERY = 30_000;
const CACHE_MS_EMPTY = 12_000;
const MAX_CACHE_ENTRIES = 200;

type CacheRow = {
  fetchedAt: number;
  data: WorkspaceSearchResults;
};

const cache = new Map<string, CacheRow>();

export function searchCacheKey(
  userId: string,
  query: string,
  recentSymbols: string[]
): string {
  const recent = [...recentSymbols].map((s) => s.toUpperCase()).sort().join(",");
  return `${userId}|${query.trim().toLowerCase()}|${recent}`;
}

export function getCachedSearch(
  key: string,
  query: string
): WorkspaceSearchResults | null {
  const row = cache.get(key);
  if (!row) return null;

  const ttl = query.trim() ? CACHE_MS_QUERY : CACHE_MS_EMPTY;
  if (Date.now() - row.fetchedAt > ttl) {
    cache.delete(key);
    return null;
  }

  return row.data;
}

export function setCachedSearch(key: string, data: WorkspaceSearchResults): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { fetchedAt: Date.now(), data });
}
