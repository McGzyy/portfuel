"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useProQuoteRefresh } from "@/hooks/useProQuoteRefresh";

export function ProQuoteRefreshMount({
  enabled,
  symbols,
}: {
  enabled: boolean;
  /** Optional scope — defaults to watchlist + your calls on the server. */
  symbols?: string[];
}) {
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/pro/refresh-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(symbols?.length ? { symbols } : {}),
      });
      if (res.ok) router.refresh();
    } catch {
      /* ignore */
    }
  }, [router, symbols]);

  useProQuoteRefresh({ enabled, onRefresh: refresh });
  return null;
}
