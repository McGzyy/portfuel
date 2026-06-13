import { AlertTriangle } from "lucide-react";
import { isCallStopHit } from "@/lib/calls/stop-cross";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CallCloseButton } from "@/components/calls/CallCloseButton";

type StopHitCall = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  stop_price?: number | null;
  last_price?: number | null;
  entry_price?: number | null;
  price_at_call?: number | null;
  closed_at?: string | null;
};

export function CallStopHitNotice({
  call,
  showClose = false,
  className,
}: {
  call: StopHitCall;
  showClose?: boolean;
  className?: string;
}) {
  const hit = isCallStopHit({
    direction: call.direction,
    stop_price: call.stop_price ?? null,
    last_price: call.last_price ?? null,
    entry_price: call.entry_price ?? null,
    price_at_call: call.price_at_call ?? null,
    closed_at: call.closed_at,
  });

  if (!hit || call.stop_price == null) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/30",
        className
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2 text-xs text-amber-900 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Stop hit</span>
          {" — "}Price is through your ${formatPrice(Number(call.stop_price))} stop on{" "}
          {call.symbol}. Close the call to lock your return.
        </span>
      </div>
      {showClose ? (
        <CallCloseButton
          callId={call.id}
          symbol={call.symbol}
          stopHit
          className="shrink-0 text-amber-800 hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-50"
        />
      ) : null}
    </div>
  );
}
