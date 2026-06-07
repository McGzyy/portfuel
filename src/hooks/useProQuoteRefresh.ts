"use client";

import { useEffect, useRef } from "react";
import { PRO_QUOTES_POLL_MS } from "@/lib/market/quote-cadence";

/**
 * Poll fresh quotes for Pro members on active workspace surfaces (ticker, watchlist, book).
 */
export function useProQuoteRefresh(opts: {
  enabled: boolean;
  onRefresh: () => void | Promise<void>;
  /** Delay first poll so SSR data is shown immediately. */
  initialDelayMs?: number;
}) {
  const onRefreshRef = useRef(opts.onRefresh);
  onRefreshRef.current = opts.onRefresh;

  useEffect(() => {
    if (!opts.enabled) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (cancelled) return;
      void onRefreshRef.current();
    };

    const delay = opts.initialDelayMs ?? PRO_QUOTES_POLL_MS;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      tick();
      intervalId = setInterval(tick, PRO_QUOTES_POLL_MS);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [opts.enabled, opts.initialDelayMs]);
}
