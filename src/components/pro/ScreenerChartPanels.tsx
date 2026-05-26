"use client";

import { ChartFrame } from "@/components/charts/ChartFrame";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { formatPct } from "@/lib/utils";

export function ScreenerChartPanels({ data }: { data: CommunityScreenerData }) {
  const mostCalledBars = data.mostCalled.map((r) => ({
    id: r.symbol,
    label: r.symbol,
    value: r.callCount,
    href: `/ticker/${r.symbol}`,
    sublabel: `${r.latestDirection} · best ${formatPct(r.bestReturnPct)}`,
    valueLabel: `${r.callCount} call${r.callCount === 1 ? "" : "s"}`,
  }));

  const topReturnBars = data.topReturns.map((r, i) => ({
    id: `${r.symbol}-${i}`,
    label: r.symbol,
    value: Math.max(0, r.return_pct),
    href: `/ticker/${r.symbol}`,
    sublabel: `@${r.username} · ${r.direction}`,
    valueLabel: formatPct(r.return_pct),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartFrame
        title="Most called"
        subtitle="Symbols with the most new member theses · 7 days"
      >
        <HorizontalBarChart items={mostCalledBars} maxItems={10} />
      </ChartFrame>

      <ChartFrame
        title="Best returns"
        subtitle="Top performing member calls · 30 days"
      >
        <HorizontalBarChart
          items={topReturnBars}
          maxItems={10}
          valueFormatter={(v) => formatPct(v)}
        />
      </ChartFrame>
    </div>
  );
}
