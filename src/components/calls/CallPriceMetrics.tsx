import { cn, formatPrice } from "@/lib/utils";
import { CallTargetProgressBar } from "@/components/calls/CallTargetProgressBar";

type CallPriceMetricsProps = {
  entry_price?: number | null;
  target_price?: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  target_progress?: number | null;
  timeframe_tag?: string | null;
  callState?: string | null;
  triggerEntryPrice?: number | null;
  compact?: boolean;
  live?: boolean;
  /** When false, progress bar is omitted (shown elsewhere on the card). */
  showProgressBar?: boolean;
  /** Strip layout for ticker thesis cards. */
  variant?: "default" | "strip";
};

export function CallPriceMetrics({
  entry_price,
  target_price,
  stop_price,
  last_price,
  target_progress,
  timeframe_tag,
  callState,
  triggerEntryPrice,
  compact,
  live,
  showProgressBar = true,
  variant = "default",
}: CallPriceMetricsProps) {
  const isPending = callState === "pending_entry";
  const hasPrices =
    (isPending ? triggerEntryPrice != null : entry_price != null) ||
    target_price != null ||
    stop_price != null;
  const progress =
    target_progress != null ? Math.min(100, Math.max(0, target_progress)) : null;

  if (!hasPrices && progress == null && !timeframe_tag) return null;

  if (variant === "strip") {
    return (
      <div className="border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/40 px-5 py-4 sm:px-6">
        {hasPrices ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {isPending && triggerEntryPrice != null ? (
              <div className="pf-ticker-metric-tile">
                <dt>Trigger</dt>
                <dd>${formatPrice(Number(triggerEntryPrice))}</dd>
              </div>
            ) : entry_price != null ? (
              <div className="pf-ticker-metric-tile">
                <dt>Entry</dt>
                <dd>${formatPrice(Number(entry_price))}</dd>
              </div>
            ) : null}
            {target_price != null ? (
              <div className="pf-ticker-metric-tile">
                <dt>Target</dt>
                <dd>${formatPrice(Number(target_price))}</dd>
              </div>
            ) : null}
            {stop_price != null ? (
              <div className="pf-ticker-metric-tile">
                <dt>Stop</dt>
                <dd>${formatPrice(Number(stop_price))}</dd>
              </div>
            ) : null}
            {last_price != null ? (
              <div className="pf-ticker-metric-tile">
                <dt>{live ? "Last (live)" : "Last"}</dt>
                <dd>${formatPrice(Number(last_price))}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {progress != null && !isPending && showProgressBar ? (
          <div className={cn(hasPrices && "mt-4")}>
            <CallTargetProgressBar progress={progress} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        compact ? "mt-3 border-t border-[var(--pf-border)]/80 pt-3" : "mt-4 border-t border-[var(--pf-border)]/80 pt-4"
      )}
    >
      {hasPrices ? (
        <dl
          className={cn(
            "grid gap-x-4 gap-y-3 text-xs",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
          )}
        >
          {isPending && triggerEntryPrice != null ? (
            <div>
              <dt className="font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">Trigger</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--pf-gray-800)]">
                ${formatPrice(Number(triggerEntryPrice))}
              </dd>
            </div>
          ) : entry_price != null ? (
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
              <dt className="font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
                Last{live ? " (live)" : ""}
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--pf-gray-800)]">
                ${formatPrice(Number(last_price))}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {progress != null && !isPending && showProgressBar ? (
        <div className={cn(hasPrices && "mt-3")}>
          <CallTargetProgressBar progress={progress} size={compact ? "slim" : "default"} />
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
