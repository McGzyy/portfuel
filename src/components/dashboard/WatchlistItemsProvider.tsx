"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { WatchlistEntry } from "@/lib/watchlist/types";

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

  useEffect(() => {
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
