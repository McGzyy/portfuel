import { Target } from "lucide-react";
import { isCallTargetHit } from "@/lib/calls/target-hit";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CallCloseButton } from "@/components/calls/CallCloseButton";

type TargetHitCall = {
  id: string;
  symbol: string;
  target_price?: number | null;
  target_progress?: number | null;
  closed_at?: string | null;
};

export function CallTargetHitNotice({
  call,
  showClose = false,
  className,
}: {
  call: TargetHitCall;
  showClose?: boolean;
  className?: string;
}) {
  const hit = isCallTargetHit(call);
  if (!hit || call.target_price == null) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/50 dark:bg-emerald-950/30",
        className
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2 text-xs text-emerald-900 dark:text-emerald-100">
        <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Target reached</span>
          {" — "}Price hit your ${formatPrice(Number(call.target_price))} target on {call.symbol}.
          Close at market to lock your return on your track record.
        </span>
      </div>
      {showClose ? (
        <CallCloseButton
          callId={call.id}
          symbol={call.symbol}
          targetHit
          className="shrink-0 text-emerald-800 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-emerald-50"
        />
      ) : null}
    </div>
  );
}
