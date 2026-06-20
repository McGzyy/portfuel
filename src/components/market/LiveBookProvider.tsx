"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import type { LiveCallMetrics } from "@/lib/workspace/live-book-sync";
import {
  PRO_LIVE_BOOK_POLL_MS,
  STANDARD_LIVE_BOOK_POLL_MS,
} from "@/lib/market/quote-cadence";

export type LiveBookStatus = "idle" | "live" | "stale" | "refreshing" | "error";

type LiveBookContextValue = {
  metricsById: Map<string, LiveCallMetrics>;
  summary: MemberOpenBookSummary | null;
  openCount: number;
  fetchedAt: string | null;
  status: LiveBookStatus;
  isPro: boolean;
  pollIntervalMs: number;
  staleAfterMs: number;
  quoteErrors: string[];
  refreshNow: () => Promise<void>;
};

const LiveBookContext = createContext<LiveBookContextValue | null>(null);

function deriveStatus(
  fetchedAt: string | null,
  staleAfterMs: number,
  refreshing: boolean,
  errored: boolean
): LiveBookStatus {
  if (refreshing) return "refreshing";
  if (errored && !fetchedAt) return "error";
  if (!fetchedAt) return "idle";
  const age = Date.now() - new Date(fetchedAt).getTime();
  if (age > staleAfterMs) return "stale";
  return "live";
}

export function LiveBookProvider({
  isPro,
  children,
}: {
  isPro: boolean;
  children: ReactNode;
}) {
  const [metricsById, setMetricsById] = useState<Map<string, LiveCallMetrics>>(new Map());
  const [summary, setSummary] = useState<MemberOpenBookSummary | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [pollIntervalMs, setPollIntervalMs] = useState(
    isPro ? PRO_LIVE_BOOK_POLL_MS : STANDARD_LIVE_BOOK_POLL_MS
  );
  const [staleAfterMs, setStaleAfterMs] = useState(pollIntervalMs * 2);
  const [quoteErrors, setQuoteErrors] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errored, setErrored] = useState(false);
  const [, setTick] = useState(0);

  const applyPayload = useCallback(
    (data: {
      fetchedAt: string;
      pollIntervalMs: number;
      staleAfterMs: number;
      openCount: number;
      calls: LiveCallMetrics[];
      summary: MemberOpenBookSummary | null;
      quoteErrors: string[];
    }) => {
      setFetchedAt(data.fetchedAt);
      setPollIntervalMs(data.pollIntervalMs);
      setStaleAfterMs(data.staleAfterMs);
      setOpenCount(data.openCount);
      setSummary(data.summary);
      setQuoteErrors(data.quoteErrors);
      setMetricsById(new Map(data.calls.map((c) => [c.id, c])));
      setErrored(false);
      setTick((t) => t + 1);
    },
    []
  );

  const refreshNow = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/workspace/live-book", { method: "POST" });
      if (!res.ok) {
        setErrored(true);
        return;
      }
      const data = await res.json();
      if (data.ok) applyPayload(data);
    } catch {
      setErrored(true);
    } finally {
      setRefreshing(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    void refreshNow();
  }, [refreshNow]);

  useEffect(() => {
    if (openCount === 0 && fetchedAt != null) return;

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshNow();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = setInterval(() => {
      if (openCount === 0) return;
      if (document.visibilityState === "hidden") return;
      void refreshNow();
    }, pollIntervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(intervalId);
    };
  }, [openCount, fetchedAt, pollIntervalMs, refreshNow]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const status = deriveStatus(fetchedAt, staleAfterMs, refreshing, errored);

  const value = useMemo<LiveBookContextValue>(
    () => ({
      metricsById,
      summary,
      openCount,
      fetchedAt,
      status,
      isPro,
      pollIntervalMs,
      staleAfterMs,
      quoteErrors,
      refreshNow,
    }),
    [
      metricsById,
      summary,
      openCount,
      fetchedAt,
      status,
      isPro,
      pollIntervalMs,
      staleAfterMs,
      quoteErrors,
      refreshNow,
    ]
  );

  return <LiveBookContext.Provider value={value}>{children}</LiveBookContext.Provider>;
}

export function useLiveBookOptional(): LiveBookContextValue | null {
  return useContext(LiveBookContext);
}

export function useLiveBookStatus() {
  const live = useLiveBookOptional();
  return {
    status: live?.status ?? ("idle" as LiveBookStatus),
    fetchedAt: live?.fetchedAt ?? null,
    isPro: live?.isPro ?? false,
    pollIntervalMs: live?.pollIntervalMs ?? STANDARD_LIVE_BOOK_POLL_MS,
    quoteErrors: live?.quoteErrors ?? [],
    refreshNow: live?.refreshNow,
    openCount: live?.openCount ?? 0,
  };
}

export function useLiveBookSummary(
  fallback: MemberOpenBookSummary | null
): MemberOpenBookSummary | null {
  const live = useLiveBookOptional();
  return live?.summary ?? fallback;
}

export function useMergedCalls<T extends { id: string }>(calls: T[]): T[] {
  const live = useLiveBookOptional();
  return useMemo(() => {
    if (!live || live.metricsById.size === 0) return calls;
    return calls.map((call) => {
      const patch = live.metricsById.get(call.id);
      if (!patch) return call;
      return { ...call, ...patch };
    });
  }, [calls, live]);
}
