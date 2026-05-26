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
import type { LinePoint } from "@/lib/charts/types";

const CHUNK_SIZE = 8;

type SparklineContextValue = Record<string, LinePoint[]>;

const SparklineContext = createContext<SparklineContextValue>({});

async function fetchSparklineChunk(symbols: string[]): Promise<SparklineContextValue> {
  if (symbols.length === 0) return {};
  const res = await fetch(
    `/api/market/sparklines?symbols=${encodeURIComponent(symbols.join(","))}`
  );
  if (!res.ok) return {};
  const data = (await res.json()) as { series?: SparklineContextValue };
  return data.series ?? {};
}

export function SparklineProvider({
  symbols,
  children,
  lazy = false,
}: {
  symbols: string[];
  children: ReactNode;
  /** Defer fetch until the provider enters the viewport (feed LCP). */
  lazy?: boolean;
}) {
  const [series, setSeries] = useState<SparklineContextValue>({});
  const [enabled, setEnabled] = useState(!lazy);
  const rootRef = useRef<HTMLDivElement>(null);

  const uniqueSymbols = useMemo(
    () => [...new Set(symbols.map((s) => s.toUpperCase()))].slice(0, 24),
    [symbols]
  );

  const symbolKey = uniqueSymbols.join(",");

  useEffect(() => {
    if (!lazy) return;
    const node = rootRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setEnabled(true);
      },
      { rootMargin: "120px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!enabled || uniqueSymbols.length === 0) return;

    const controller = new AbortController();

    (async () => {
      const merged: SparklineContextValue = {};
      for (let i = 0; i < uniqueSymbols.length; i += CHUNK_SIZE) {
        if (controller.signal.aborted) return;
        const chunk = uniqueSymbols.slice(i, i + CHUNK_SIZE);
        const part = await fetchSparklineChunk(chunk);
        Object.assign(merged, part);
      }
      if (!controller.signal.aborted) setSeries(merged);
    })().catch(() => {
      /* ignore */
    });

    return () => controller.abort();
  }, [enabled, symbolKey, uniqueSymbols]);

  return (
    <SparklineContext.Provider value={series}>
      <div ref={rootRef}>{children}</div>
    </SparklineContext.Provider>
  );
}

export function useSparkline(symbol: string): LinePoint[] {
  const series = useContext(SparklineContext);
  return series[symbol.toUpperCase()] ?? [];
}
