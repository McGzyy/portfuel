"use client";

import dynamic from "next/dynamic";
import type { CandlePoint, ChartMarker } from "@/components/charts/TickerChart";

const TickerChart = dynamic(
  () => import("@/components/charts/TickerChart").then((m) => m.TickerChart),
  { ssr: false, loading: () => <div className="h-[380px] animate-pulse rounded-xl bg-[var(--pf-gray-100)]" /> }
);

export function TickerChartClient({
  candles,
  markers,
}: {
  candles: CandlePoint[];
  markers: ChartMarker[];
}) {
  return <TickerChart candles={candles} markers={markers} />;
}
