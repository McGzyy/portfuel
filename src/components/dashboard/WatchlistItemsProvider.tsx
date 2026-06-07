"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WatchlistEntry } from "@/lib/watchlist/types";

function watchlistKey(items: WatchlistEntry[]): string {
  return items.map((i) => i.symbol).join(",");
}

type WatchlistItemsContextValue = {
  items: WatchlistEntry[];
  setItems: (items: WatchlistEntry[]) => void;
};

const WatchlistItemsContext = createContext<WatchlistItemsContextValue | null>(null);

export function WatchlistItemsProvider({
  initialItems,
  children,
}: {
  initialItems: WatchlistEntry[];
  children: ReactNode;
}) {
  const [items, setItems] = useState(initialItems);
  const syncedKey = useRef(watchlistKey(initialItems));

  useEffect(() => {
    const nextKey = watchlistKey(initialItems);
    if (nextKey === syncedKey.current) return;
    syncedKey.current = nextKey;
    setItems(initialItems);
  }, [initialItems]);

  const value = useMemo(() => ({ items, setItems }), [items]);

  return (
    <WatchlistItemsContext.Provider value={value}>{children}</WatchlistItemsContext.Provider>
  );
}

export function useWatchlistItems() {
  const ctx = useContext(WatchlistItemsContext);
  if (!ctx) {
    throw new Error("useWatchlistItems must be used within WatchlistItemsProvider");
  }
  return ctx;
}

/** Optional hook for components that may render outside the provider. */
export function useWatchlistItemsOptional() {
  return useContext(WatchlistItemsContext);
}
