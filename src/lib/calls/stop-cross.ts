export type StopCrossCall = {
  direction: "long" | "short";
  stop_price: number | null;
  closed_at?: string | null;
  last_price: number | null;
  entry_price: number | null;
  price_at_call: number | null;
};

/** True when price is at or beyond the stop for this direction. */
export function isPriceThroughStop(
  direction: "long" | "short",
  lastPrice: number,
  stopPrice: number
): boolean {
  if (direction === "long") return lastPrice <= stopPrice;
  return lastPrice >= stopPrice;
}

/** True when price crossed through the stop between two quotes. */
export function crossedStop(
  direction: "long" | "short",
  prevPrice: number,
  newPrice: number,
  stopPrice: number
): boolean {
  if (prevPrice === newPrice) return false;
  return (
    !isPriceThroughStop(direction, prevPrice, stopPrice) &&
    isPriceThroughStop(direction, newPrice, stopPrice)
  );
}

/** Prior quote for cross detection: last stored mark, else entry / price at call. */
export function referencePriceForStopCross(call: StopCrossCall): number | null {
  if (call.last_price != null) return Number(call.last_price);
  const basis = call.entry_price ?? call.price_at_call;
  return basis != null ? Number(basis) : null;
}

export function shouldNotifyStopCross(
  call: StopCrossCall,
  newLastPrice: number
): boolean {
  if (call.closed_at) return false;
  const stop = call.stop_price;
  if (stop == null || stop <= 0) return false;
  const prev = referencePriceForStopCross(call);
  if (prev == null) return false;
  return crossedStop(call.direction, prev, newLastPrice, Number(stop));
}

export function isCallStopHit(
  call: StopCrossCall & { closed_at?: string | null }
): boolean {
  if (call.closed_at) return false;
  const stop = call.stop_price;
  const last = call.last_price;
  if (stop == null || stop <= 0 || last == null) return false;
  return isPriceThroughStop(call.direction, Number(last), Number(stop));
}
