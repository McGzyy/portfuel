import type { CallWithUser } from "@/lib/db/supabase";

/** Serializable call payload for chart hover + modal (matches CallThesisBlock). */
export type ChartCallPreview = {
  id: string;
  user_id?: string;
  symbol?: string;
  asset_class?: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  entry_price: number | null;
  price_at_call?: number | null;
  target_price: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  target_progress: number | null;
  timeframe_tag: string | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  call_state?: string | null;
  trigger_entry_price?: number | null;
  expires_at?: string | null;
  live?: boolean;
  is_fueled: boolean;
  from_discovery?: boolean;
  vote_score: number;
  comment_count: number;
  users: {
    display_name: string | null;
    pin: string;
    username?: string | null;
    trusted_at: string | null;
    avatar_url?: string | null;
  };
};

export function toChartCallPreview(
  c: CallWithUser & { live?: boolean; from_discovery?: boolean }
): ChartCallPreview {
  return {
    id: c.id,
    user_id: c.user_id,
    symbol: c.symbol,
    asset_class: c.asset_class ?? undefined,
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    entry_price: c.entry_price,
    price_at_call: c.price_at_call,
    target_price: c.target_price,
    stop_price: c.stop_price,
    last_price: c.last_price,
    target_progress: c.target_progress,
    timeframe_tag: c.timeframe_tag,
    peak_return_pct: c.peak_return_pct ?? null,
    closed_at: c.closed_at ?? null,
    call_state: c.call_state ?? null,
    trigger_entry_price: c.trigger_entry_price ?? null,
    expires_at: c.expires_at ?? null,
    live: c.live,
    is_fueled: c.is_fueled,
    from_discovery: c.from_discovery,
    vote_score: c.vote_score,
    comment_count: c.comment_count,
    users: {
      display_name: c.users.display_name,
      pin: c.users.username ?? c.users.pin,
      username: c.users.username,
      trusted_at: c.users.trusted_at,
      avatar_url: c.users.avatar_url ?? null,
    },
  };
}

export function indexChartCalls(
  calls: ChartCallPreview[]
): Record<string, ChartCallPreview> {
  const map: Record<string, ChartCallPreview> = {};
  for (const c of calls) map[c.id] = c;
  return map;
}

export function truncateThesis(text: string, max = 140): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}
