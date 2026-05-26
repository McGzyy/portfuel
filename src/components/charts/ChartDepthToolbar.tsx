"use client";

import { cn } from "@/lib/utils";
import {
  CHART_RESOLUTION_LABELS,
  type ChartCandleResolution,
} from "@/lib/charts/types";

export function ChartDepthToolbar({
  resolution,
  onResolutionChange,
  showSma,
  onShowSmaChange,
  showVwap,
  onShowVwapChange,
  showVolume,
  onShowVolumeChange,
  proUnlocked,
  volumeAvailable,
}: {
  resolution: ChartCandleResolution;
  onResolutionChange: (r: ChartCandleResolution) => void;
  showSma: boolean;
  onShowSmaChange: (v: boolean) => void;
  showVwap: boolean;
  onShowVwapChange: (v: boolean) => void;
  showVolume: boolean;
  onShowVolumeChange: (v: boolean) => void;
  proUnlocked: boolean;
  volumeAvailable: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-1">
        {CHART_RESOLUTION_LABELS.map(({ key, label, proOnly }) => {
          const locked = proOnly && !proUnlocked;
          const active = resolution === key;
          return (
            <button
              key={key}
              type="button"
              disabled={locked}
              onClick={() => onResolutionChange(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                active
                  ? "bg-[var(--pf-black)] text-white"
                  : "text-[var(--pf-gray-600)] hover:bg-white",
                locked && "cursor-not-allowed opacity-40"
              )}
              title={locked ? "Pro Intelligence required" : undefined}
            >
              {label}
              {proOnly ? (
                <span className="ml-1 text-[9px] font-bold uppercase text-[var(--pf-red)]">
                  Pro
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--pf-gray-600)]">
          <input
            type="checkbox"
            className="accent-[var(--pf-red)]"
            checked={showVolume}
            disabled={!volumeAvailable}
            onChange={(e) => onShowVolumeChange(e.target.checked)}
          />
          Volume
        </label>
        <label
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-1 text-xs font-semibold",
            proUnlocked ? "cursor-pointer text-[var(--pf-gray-600)]" : "cursor-not-allowed opacity-40"
          )}
        >
          <input
            type="checkbox"
            className="accent-[var(--pf-red)]"
            checked={showSma}
            disabled={!proUnlocked}
            onChange={(e) => onShowSmaChange(e.target.checked)}
          />
          SMA 20
        </label>
        <label
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-1 text-xs font-semibold",
            proUnlocked && volumeAvailable
              ? "cursor-pointer text-[var(--pf-gray-600)]"
              : "cursor-not-allowed opacity-40"
          )}
        >
          <input
            type="checkbox"
            className="accent-[var(--pf-red)]"
            checked={showVwap}
            disabled={!proUnlocked || !volumeAvailable}
            onChange={(e) => onShowVwapChange(e.target.checked)}
          />
          VWAP
        </label>
      </div>
    </div>
  );
}
