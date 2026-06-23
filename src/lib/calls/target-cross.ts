import type { StopCrossCall } from "@/lib/calls/stop-cross";
import { referencePriceForStopCross } from "@/lib/calls/stop-cross";

export type TargetCrossCall = StopCrossCall & {
  target_price: number | null;
};

/** True when price is at or beyond the target for this direction. */
export function isPriceThroughTarget(
  direction: "long" | "short",
  lastPrice: number,
  targetPrice: number
): boolean {
  if (direction === "long") return lastPrice >= targetPrice;
  return lastPrice <= targetPrice;
}

/** True when price crossed through the target between two quotes. */
export function crossedTarget(
  direction: "long" | "short",
  prevPrice: number,
  newPrice: number,
  targetPrice: number
): boolean {
  if (prevPrice === newPrice) return false;
  return (
    !isPriceThroughTarget(direction, prevPrice, targetPrice) &&
    isPriceThroughTarget(direction, newPrice, targetPrice)
  );
}

export function shouldNotifyTargetCross(
  call: TargetCrossCall,
  newLastPrice: number
): boolean {
  if (call.closed_at) return false;
  const target = call.target_price;
  if (target == null || target <= 0) return false;
  const prev = referencePriceForStopCross(call);
  if (prev == null) return false;
  return crossedTarget(call.direction, prev, newLastPrice, Number(target));
}
