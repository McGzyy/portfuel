"use client";

import { computeTradeSetup } from "@/lib/trading/setup-metrics";
import { cn } from "@/lib/utils";

export function TradeSetupPreview({
  direction,
  entryPrice,
  targetPrice,
  stopPrice,
}: {
  direction: "long" | "short";
  entryPrice: string;
  targetPrice: string;
  stopPrice: string;
}) {
  const entry = parseFloat(entryPrice);
  const target = targetPrice ? parseFloat(targetPrice) : undefined;
  const stop = stopPrice ? parseFloat(stopPrice) : undefined;

  if (!Number.isFinite(entry) || entry <= 0) return null;
  if (target == null && stop == null) return null;

  const { rewardPct, riskPct, riskReward, hint } = computeTradeSetup(
    direction,
    entry,
    target,
    stop
  );

  const fmt = (v: number | null) =>
    v == null || Number.isNaN(v) ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <div
      className={cn(
        "rounded-[var(--pf-radius-lg)] border px-4 py-3",
        hint
          ? "border-amber-200 bg-amber-50"
          : "border-[var(--pf-border)] bg-[var(--pf-gray-50)]"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Trade setup preview
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-[10px] font-medium uppercase text-[var(--pf-gray-400)]">
            Upside
          </dt>
          <dd className="font-bold tabular-nums text-emerald-600">{fmt(rewardPct)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase text-[var(--pf-gray-400)]">
            Risk
          </dt>
          <dd className="font-bold tabular-nums text-rose-600">{fmt(riskPct)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase text-[var(--pf-gray-400)]">
            R:R
          </dt>
          <dd className="font-bold tabular-nums text-[var(--pf-black)]">
            {riskReward != null ? `${riskReward.toFixed(2)}×` : "—"}
          </dd>
        </div>
      </dl>
      {hint ? <p className="mt-2 text-xs text-amber-800">{hint}</p> : null}
    </div>
  );
}
