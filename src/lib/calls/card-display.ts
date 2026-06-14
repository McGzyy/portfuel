import type { CallCardData } from "@/components/calls/CallCard";
import { computeTargetProgress } from "@/lib/scoring/returns";

type CallPriceRow = {
  direction: "long" | "short";
  entry_price: number | null;
  price_at_call?: number | null;
  target_price: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  target_progress: number | null;
};

/** Map DB call prices to what CallCard / CallPriceMetrics expect. */
export function normalizeCallCardPrices(call: CallPriceRow): {
  entry_price: number | null;
  target_price: number | null;
  stop_price: number | null;
  last_price: number | null;
  target_progress: number | null;
} {
  const entry_price = call.entry_price ?? call.price_at_call ?? null;
  let target_progress = call.target_progress;

  if (
    target_progress == null &&
    entry_price != null &&
    call.target_price != null &&
    call.last_price != null
  ) {
    target_progress = computeTargetProgress({
      direction: call.direction,
      entry: Number(entry_price),
      target: Number(call.target_price),
      lastPrice: Number(call.last_price),
    });
  }

  return {
    entry_price,
    target_price: call.target_price,
    stop_price: call.stop_price ?? null,
    last_price: call.last_price ?? null,
    target_progress,
  };
}

export function mapCallRowToCardData(
  c: CallPriceRow & {
    id: string;
    user_id?: string;
    symbol: string;
    asset_class?: string | null;
    thesis: string;
    called_at: string;
    return_pct: number | null;
    peak_return_pct?: number | null;
    closed_at?: string | null;
    call_state?: string | null;
    trigger_entry_price?: number | null;
    expires_at?: string | null;
    timeframe_tag: string | null;
    is_fueled: boolean;
    vote_score?: number;
    comment_count?: number;
  },
  member: {
    display_name: string | null;
    username: string;
    trusted?: boolean;
  },
  extras?: { user_id?: string }
): CallCardData {
  const prices = normalizeCallCardPrices(c);
  return {
    id: c.id,
    user_id: extras?.user_id ?? c.user_id,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    peak_return_pct: c.peak_return_pct ?? null,
    closed_at: c.closed_at ?? null,
    call_state: c.call_state ?? null,
    trigger_entry_price: c.trigger_entry_price ?? null,
    expires_at: c.expires_at ?? null,
    ...prices,
    timeframe_tag: c.timeframe_tag,
    is_fueled: c.is_fueled,
    vote_score: c.vote_score ?? 0,
    comment_count: c.comment_count ?? 0,
    display_name: member.display_name,
    pin: member.username,
    username: member.username,
    is_trusted: member.trusted ?? false,
  };
}
