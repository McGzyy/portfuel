import { cn, formatPrice } from "@/lib/utils";

type CallPriceMetricsProps = {
  entry_price?: number | null;
  target_price?: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  target_progress?: number | null;
  timeframe_tag?: string | null;
  compact?: boolean;
};

export function CallPriceMetrics({
  entry_price,
  target_price,
  stop_price,
  last_price,
  target_progress,
  timeframe_tag,
  compact,
}: CallPriceMetricsProps) {
  const hasPrices = entry_price != null || target_price != null || stop_price != null;
  const progress =
    target_progress != null ? Math.min(100, Math.max(0, target_progress)) : null;

  if (!hasPrices && progress == null && !timeframe_tag) return null;

  return (
    <div className={cn("border-t border-[var(--pf-border)]/80", compact ? "mt-3 pt-3" : "mt-4 pt-4")}>
      {hasPrices ? (
        <dl
          className={cn(
            "grid gap-x-4 gap-y-1 text-xs",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
          )}
        >
          {entry_price != null ? (
            <div>
              <dt className="font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">Entry</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--pf-gray-800)]">
                ${formatPrice(Number(entry_price))}
              </dd>
            </div>
          ) : null}
          {target_price != null ? (
            <div>
              <dt className="font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">Target</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--pf-gray-800)]">
                ${formatPrice(Number(target_price))}
              </dd>
            </div>
          ) : null}
          {stop_price != null ? (
            <div>
              <dt className="font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">Stop</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--pf-gray-800)]">
                ${formatPrice(Number(stop_price))}
              </dd>
            </div>
          ) : null}
          {last_price != null ? (
            <div>
              <dt className="font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">Last</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--pf-gray-800)]">
                ${formatPrice(Number(last_price))}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {progress != null ? (
        <div className={cn(hasPrices && "mt-3")}>
          <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            <span>Progress to target</span>
            <span className="tabular-nums text-[var(--pf-gray-600)]">{progress.toFixed(0)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
            <div
              className="h-full rounded-full bg-[var(--pf-red)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {timeframe_tag ? (
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
          {timeframe_tag}
        </p>
      ) : null}
    </div>
  );
}
