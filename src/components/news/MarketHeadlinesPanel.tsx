"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Newspaper } from "lucide-react";
import { MarketHeadlineList } from "@/components/news/MarketHeadlineList";
import {
  MARKET_HEADLINE_LANES,
  type MarketHeadline,
  type MarketHeadlineLane,
} from "@/lib/market/market-headlines";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import { cn } from "@/lib/utils";

export function MarketHeadlinesPanel({
  initialLane,
  initialHeadlines,
  watchlistCount,
}: {
  initialLane: MarketHeadlineLane;
  initialHeadlines: MarketHeadline[];
  watchlistCount: number;
}) {
  const router = useRouter();
  const [lane, setLane] = useState<MarketHeadlineLane>(initialLane);
  const [headlines, setHeadlines] = useState<MarketHeadline[]>(initialHeadlines);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchedLane = useRef<MarketHeadlineLane>(initialLane);

  const load = useCallback(async (nextLane: MarketHeadlineLane) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/market/headlines?lane=${encodeURIComponent(nextLane)}`);
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load headlines.");
        return;
      }
      setHeadlines((data.headlines ?? []) as MarketHeadline[]);
    } catch {
      setError("Could not load headlines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLane(initialLane);
    setHeadlines(initialHeadlines);
    fetchedLane.current = initialLane;
  }, [initialLane, initialHeadlines]);

  useEffect(() => {
    if (lane === fetchedLane.current) return;
    fetchedLane.current = lane;
    void load(lane);
  }, [lane, load]);

  function selectLane(nextLane: MarketHeadlineLane) {
    setLane(nextLane);
    const href = buildResearchHubHref("news", { lane: nextLane });
    router.replace(href, { scroll: false });
  }

  const activeLaneMeta =
    MARKET_HEADLINE_LANES.find((l) => l.id === lane) ?? MARKET_HEADLINE_LANES[0]!;

  return (
    <div className="pf-workspace-panel p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
          <Newspaper className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Market headlines
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            Broad market and crypto context from Finnhub — not the same as per-ticker news on Intel
            pages. Per-symbol headlines still live on each ticker.
          </p>
        </div>
      </div>

      <nav
        className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Headline categories"
      >
        {MARKET_HEADLINE_LANES.map((tab) => {
          const disabled = tab.id === "watchlist" && watchlistCount === 0;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => selectLane(tab.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                lane === tab.id ? "pf-pill-active" : "pf-pill-inactive"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <p className="mt-3 text-xs text-[var(--pf-gray-500)]">{activeLaneMeta.description}</p>

      {lane === "watchlist" && watchlistCount === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-[var(--pf-gray-700)]">No watchlist symbols yet</p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Add tickers on your watchlist to see headlines that tag those symbols.
          </p>
          <Link
            href="/dashboard/watchlist"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Open watchlist →
          </Link>
        </div>
      ) : loading ? (
        <div className="mt-8 flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--pf-red)]" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-rose-600">{error}</p>
      ) : (
        <div className="mt-4">
          <MarketHeadlineList items={headlines} />
        </div>
      )}
    </div>
  );
}
