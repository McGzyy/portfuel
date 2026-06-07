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
import type { AssetClass } from "@/lib/market/validate-symbol";
import { filterCandlesByRange, filterMarkersByRange } from "@/lib/charts/range";
import { computeSma, computeVwap, hasVolumeData } from "@/lib/charts/indicators";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";
import { indexChartCalls, toChartCallPreview } from "@/lib/charts/chart-call-preview";
import type { CallWithUser } from "@/lib/db/supabase";
import { ChartCallDetailModal } from "@/components/charts/ChartCallDetailModal";

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
  assetClass,
  markers,
  priceLines = [],
  proUnlocked = false,
  className,
  title = "Price history",
  subtitle,
  journalMarkerCount = 0,
  chartCalls,
  interactive = false,
  viewerUserId,
  isPro = false,
  showUpgrade = false,
  canGenerateSummary = false,
  isAdmin = false,
}: {
  symbol: string;
  initialCandles: CandlePoint[];
  /** Ensures crypto symbols use the crypto candle path (Twelve Data BTC/USD, etc.). */
  assetClass?: AssetClass;
  markers: ChartMarker[];
  priceLines?: PriceLine[];
  proUnlocked?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  journalMarkerCount?: number;
  /** When set, call markers open an in-page modal instead of scrolling away from the chart. */
  chartCalls?: (CallWithUser & { live?: boolean })[];
  interactive?: boolean;
  viewerUserId?: string | null;
  isPro?: boolean;
  showUpgrade?: boolean;
  canGenerateSummary?: boolean;
  isAdmin?: boolean;
}) {
  const [range, setRange] = useState<ChartRangeKey>("1y");
  const [resolution, setResolution] = useState<ChartCandleResolution>("D");
  const [candles, setCandles] = useState<CandlePoint[]>(initialCandles);
  const [loadingCandles, setLoadingCandles] = useState(initialCandles.length === 0);
  const [candleError, setCandleError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(initialCandles.length > 0);
  const [showVolume, setShowVolume] = useState(true);
  const [showSma, setShowSma] = useState(false);
  const [showVwap, setShowVwap] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const callPreviewsById = useMemo(() => {
    if (!chartCalls?.length) return undefined;
    const previews: ChartCallPreview[] = chartCalls.map(toChartCallPreview);
    return indexChartCalls(previews);
  }, [chartCalls]);

  const selectedCall = selectedCallId && callPreviewsById ? callPreviewsById[selectedCallId] : null;

  const loadCandles = useCallback(
    async (res: ChartCandleResolution) => {
      setLoadingCandles(true);
      setCandleError(null);
      try {
        const params = new URLSearchParams({ resolution: res });
        if (assetClass === "crypto") params.set("asset", "crypto");
        const response = await fetch(
          `/api/tickers/${encodeURIComponent(symbol)}/candles?${params}`
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
        setFetchAttempted(true);
      }
    },
    [symbol, assetClass]
  );

  useEffect(() => {
    if (resolution !== "D") {
      void loadCandles(resolution);
      return;
    }
    if (initialCandles.length > 0) {
      setCandles(initialCandles);
      setFetchAttempted(true);
      setLoadingCandles(false);
      return;
    }
    void loadCandles("D");
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
  const communityMarkerCount = filteredMarkers.filter((m) => m.kind !== "journal").length;
  const journalCount =
    journalMarkerCount > 0
      ? journalMarkerCount
      : filteredMarkers.filter((m) => m.kind === "journal").length;

  return (
    <ChartFrame
      className={className}
      title={title}
      subtitle={
        subtitle ??
        `Volume, Pro overlays (SMA · VWAP), and intraday intervals · ${quotesRefreshLabel({ isPro: proUnlocked })}`
      }
      legend={
        hasData ? (
          <TickerChartLegend
            callCount={communityMarkerCount}
            journalCount={journalCount}
            levelCount={priceLines.length}
            showDepth
            embedded
            callModal={Boolean(callPreviewsById)}
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
              callPreviewsById={callPreviewsById}
              onCallMarkerClick={
                callPreviewsById ? (callId) => setSelectedCallId(callId) : undefined
              }
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
              No candles in this range — try a wider window.
            </div>
          )}
        </div>
      ) : loadingCandles || !fetchAttempted ? (
        <ChartLoadingSkeleton height={400} />
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--pf-gray-500)]">
          <p className="font-medium text-[var(--pf-gray-600)]">Chart unavailable</p>
          <p className="max-w-sm text-xs">
            {candleError ??
              "Daily candles need TWELVEDATA_API_KEY on the server (free at twelvedata.com). After adding it on Vercel, redeploy so the runtime picks it up."}
          </p>
        </div>
      )}
      {selectedCall ? (
        <ChartCallDetailModal
          call={selectedCall}
          onClose={() => setSelectedCallId(null)}
          interactive={interactive}
          viewerUserId={viewerUserId}
          isPro={isPro}
          showUpgrade={showUpgrade}
          canGenerateSummary={canGenerateSummary}
          isAdmin={isAdmin}
        />
      ) : null}
    </ChartFrame>
  );
}
