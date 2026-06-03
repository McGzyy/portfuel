"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import { ChartLoadingSkeleton } from "@/components/charts/ChartLoadingSkeleton";
import { ChartDepthToolbar } from "@/components/charts/ChartDepthToolbar";
import { TickerChartLegend } from "@/components/ticker/TickerChartLegend";
import type {
  CandlePoint,
  ChartCandleResolution,
  ChartMarker,
  ChartRangeKey,
  PriceLine,
} from "@/lib/charts/types";
import { filterCandlesByRange, filterMarkersByRange } from "@/lib/charts/range";
import { computeSma, computeVwap, hasVolumeData } from "@/lib/charts/indicators";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";

const TickerChart = dynamic(
  () => import("@/components/charts/TickerChart").then((m) => m.TickerChart),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton height={440} />,
  }
);

export function TickerChartSection({
  symbol,
  initialCandles,
  markers,
  priceLines = [],
  proUnlocked = false,
  className,
}: {
  symbol: string;
  initialCandles: CandlePoint[];
  markers: ChartMarker[];
  priceLines?: PriceLine[];
  proUnlocked?: boolean;
  className?: string;
}) {
  const [range, setRange] = useState<ChartRangeKey>("1y");
  const [resolution, setResolution] = useState<ChartCandleResolution>("D");
  const [candles, setCandles] = useState<CandlePoint[]>(initialCandles);
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [candleError, setCandleError] = useState<string | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showSma, setShowSma] = useState(false);
  const [showVwap, setShowVwap] = useState(false);

  const loadCandles = useCallback(
    async (res: ChartCandleResolution) => {
      setLoadingCandles(true);
      setCandleError(null);
      try {
        const response = await fetch(
          `/api/tickers/${encodeURIComponent(symbol)}/candles?resolution=${res}`
        );
        if (response.status === 403) {
          setCandleError("Intraday intervals require Pro Intelligence.");
          setResolution("D");
          return;
        }
        if (!response.ok) throw new Error("fetch_failed");
        const data = (await response.json()) as { candles?: CandlePoint[] };
        setCandles(data.candles ?? []);
      } catch {
        setCandleError("Could not load chart data for this interval.");
      } finally {
        setLoadingCandles(false);
      }
    },
    [symbol]
  );

  useEffect(() => {
    if (resolution === "D") {
      setCandles(initialCandles);
      return;
    }
    void loadCandles(resolution);
  }, [resolution, initialCandles, loadCandles]);

  const filteredCandles = useMemo(
    () => filterCandlesByRange(candles, range),
    [candles, range]
  );
  const filteredMarkers = useMemo(
    () => filterMarkersByRange(markers, range),
    [markers, range]
  );

  const volumeOk = hasVolumeData(filteredCandles);
  const smaPoints = useMemo(
    () => (showSma && proUnlocked ? computeSma(filteredCandles, 20) : []),
    [showSma, proUnlocked, filteredCandles]
  );
  const vwapPoints = useMemo(
    () => (showVwap && proUnlocked && volumeOk ? computeVwap(filteredCandles) : []),
    [showVwap, proUnlocked, volumeOk, filteredCandles]
  );

  const hasData = candles.length > 0;

  return (
    <ChartFrame
      className={className}
      title="Price history"
      subtitle={`Volume, Pro overlays (SMA · VWAP), and intraday intervals · ${quotesRefreshLabel()}`}
      legend={
        hasData ? (
          <TickerChartLegend
            callCount={filteredMarkers.length}
            levelCount={priceLines.length}
            showDepth
            embedded
          />
        ) : undefined
      }
    >
      {hasData ? (
        <div className="space-y-3 p-3">
          <ChartDepthToolbar
            resolution={resolution}
            onResolutionChange={setResolution}
            showSma={showSma}
            onShowSmaChange={setShowSma}
            showVwap={showVwap}
            onShowVwapChange={setShowVwap}
            showVolume={showVolume}
            onShowVolumeChange={setShowVolume}
            proUnlocked={proUnlocked}
            volumeAvailable={volumeOk}
          />
          <ChartRangeToolbar value={range} onChange={setRange} />
          {candleError ? (
            <p className="text-xs text-amber-700">{candleError}</p>
          ) : null}
          {loadingCandles ? (
            <ChartLoadingSkeleton height={440} />
          ) : filteredCandles.length > 0 ? (
            <TickerChart
              candles={filteredCandles}
              markers={filteredMarkers}
              priceLines={priceLines}
              showVolume={showVolume && volumeOk}
              smaPoints={smaPoints}
              vwapPoints={vwapPoints}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
              No candles in this range — try a wider window.
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--pf-gray-500)]">
          <p className="font-medium text-[var(--pf-gray-600)]">Chart unavailable</p>
          <p className="max-w-sm text-xs">
            Add <code className="font-mono">TWELVEDATA_API_KEY</code> on the server (free at twelvedata.com).
            Finnhub free tier covers quotes but not candle history.
          </p>
        </div>
      )}
    </ChartFrame>
  );
}
