import type { CallCardData } from "@/components/calls/CallCard";
import { normalizeCallCardPrices } from "@/lib/calls/card-display";
import type { UserCallRow } from "@/lib/calls/call-fields";

/** Map a profile/book call row to feed card data (includes pending entry fields). */
export function mapUserCallRowToCard(
  c: UserCallRow,
  opts: {
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
  }
): CallCardData {
  const prices = normalizeCallCardPrices({
    direction: c.direction as "long" | "short",
    entry_price: c.entry_price,
    price_at_call: c.price_at_call,
    target_price: c.target_price,
    stop_price: c.stop_price,
    last_price: c.last_price,
    target_progress: c.target_progress,
  });

  return {
    id: c.id,
    user_id: opts.userId,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction as "long" | "short",
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    ...prices,
    timeframe_tag: c.timeframe_tag,
    is_fueled: Boolean(c.is_fueled),
    vote_score: c.vote_score,
    comment_count: c.comment_count,
    display_name: opts.displayName,
    pin: opts.username,
    username: opts.username,
    avatar_url: opts.avatarUrl ?? null,
    updated_at: c.updated_at ?? null,
    closed_at: c.closed_at ?? null,
    peak_return_pct: c.peak_return_pct ?? null,
    call_state: c.call_state ?? null,
    trigger_entry_price: c.trigger_entry_price ?? null,
    expires_at: c.expires_at ?? null,
  };
}
