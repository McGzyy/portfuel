import { createServiceClient } from "@/lib/db/supabase";
import { buildLiveCallMetricsUpdate } from "@/lib/calls/call-metrics";
import { PENDING_ENTRY_EXPIRE_DAYS, PENDING_ENTRY_EXPIRE_WARN_DAYS } from "@/lib/calls/entry-config";
import {
  notifyPendingEntryActivated,
  notifyPendingEntryExpired,
  notifyPendingEntryExpiring,
} from "@/lib/notifications/pending-entry";

type PendingCallRow = {
  id: string;
  user_id: string;
  symbol: string;
  direction: "long" | "short";
  called_at: string;
  trigger_entry_price: number | null;
  target_price: number | null;
  stop_price: number | null;
  expires_at: string | null;
  vote_score: number;
  is_fueled: boolean;
};

export function pendingEntryExpiresAt(from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + PENDING_ENTRY_EXPIRE_DAYS);
  return d.toISOString();
}

export function isTriggerCrossed(input: {
  direction: "long" | "short";
  triggerPrice: number;
  lastPrice: number;
}): boolean {
  const { direction, triggerPrice, lastPrice } = input;
  if (direction === "long") return lastPrice <= triggerPrice;
  return lastPrice >= triggerPrice;
}

export function validateConditionalTrigger(input: {
  direction: "long" | "short";
  triggerPrice: number;
  marketPrice: number;
}): { ok: true } | { ok: false; error: string } {
  const { direction, triggerPrice, marketPrice } = input;
  if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) {
    return { ok: false, error: "invalid_trigger" };
  }
  if (direction === "long" && triggerPrice >= marketPrice) {
    return { ok: false, error: "trigger_must_be_below_market" };
  }
  if (direction === "short" && triggerPrice <= marketPrice) {
    return { ok: false, error: "trigger_must_be_above_market" };
  }
  return { ok: true };
}

export async function activatePendingCall(
  call: PendingCallRow,
  lastPrice: number
): Promise<boolean> {
  const trigger = call.trigger_entry_price;
  if (trigger == null) return false;

  const db = createServiceClient();
  const activatedAt = new Date().toISOString();
  const metrics = buildLiveCallMetricsUpdate(
    {
      id: call.id,
      direction: call.direction,
      called_at: call.called_at,
      entry_price: trigger,
      target_price: call.target_price,
      price_at_call: null,
      vote_score: call.vote_score,
      closed_at: null,
    },
    lastPrice
  );

  const { error } = await db
    .from("calls")
    .update({
      call_state: "active",
      entry_price: trigger,
      activated_at: activatedAt,
      expires_at: null,
      last_price: lastPrice,
      return_pct: metrics.return_pct,
      peak_return_pct: metrics.peak_return_pct,
      target_progress: metrics.target_progress,
      score_points: metrics.score_points,
    } as never)
    .eq("id", call.id)
    .eq("call_state", "pending_entry");

  return !error;
}

export async function expirePendingCall(callId: string): Promise<boolean> {
  const db = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from("calls")
    .update({
      call_state: "expired",
      closed_at: now,
      return_pct: null,
      target_progress: null,
    } as never)
    .eq("id", callId)
    .eq("call_state", "pending_entry");

  return !error;
}

export async function cancelPendingCall(params: {
  callId: string;
  actorUserId: string;
  isAdmin: boolean;
}): Promise<
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "not_pending" | "already_closed" }
> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("id, user_id, call_state, closed_at, is_fueled")
    .eq("id", params.callId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false, error: "not_found" };

  const row = data as {
    id: string;
    user_id: string;
    call_state: string;
    closed_at: string | null;
    is_fueled: boolean;
  };

  if (row.user_id !== params.actorUserId && !params.isAdmin) {
    return { ok: false, error: "forbidden" };
  }
  if (row.closed_at && row.call_state !== "pending_entry") {
    return { ok: false, error: "already_closed" };
  }
  if (row.call_state !== "pending_entry") {
    return { ok: false, error: "not_pending" };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await db
    .from("calls")
    .update({
      call_state: "cancelled",
      closed_at: now,
      return_pct: null,
      target_progress: null,
    } as never)
    .eq("id", row.id)
    .eq("call_state", "pending_entry");

  if (updateError) throw updateError;
  return { ok: true };
}

export async function processPendingEntryCalls(
  priceBySymbol: Map<string, number>
): Promise<{ activated: number; expired: number }> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "id, user_id, symbol, direction, called_at, trigger_entry_price, target_price, stop_price, expires_at, vote_score, is_fueled"
    )
    .eq("call_state", "pending_entry");

  if (error) throw error;

  const now = Date.now();
  let activated = 0;
  let expired = 0;

  for (const raw of data ?? []) {
    const call = raw as PendingCallRow;
    if (call.expires_at && new Date(call.expires_at).getTime() <= now) {
      if (await expirePendingCall(call.id)) {
        expired++;
        void notifyPendingEntryExpired(call);
      }
      continue;
    }

    if (call.expires_at) {
      const daysLeft = Math.ceil(
        (new Date(call.expires_at).getTime() - now) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft > 0 && daysLeft <= PENDING_ENTRY_EXPIRE_WARN_DAYS) {
        void notifyPendingEntryExpiring(call, daysLeft);
      }
    }

    const last = priceBySymbol.get(call.symbol.toUpperCase());
    const trigger = call.trigger_entry_price;
    if (last == null || trigger == null) continue;

    if (!isTriggerCrossed({ direction: call.direction, triggerPrice: trigger, lastPrice: last })) {
      await db
        .from("calls")
        .update({ last_price: last } as never)
        .eq("id", call.id)
        .eq("call_state", "pending_entry");
      continue;
    }

    if (await activatePendingCall(call, last)) {
      activated++;
      void notifyPendingEntryActivated(call, last);
    }
  }

  return { activated, expired };
}

/** Recompute metrics for active calls only (skips pending). */
export function metricsForCallRow(
  call: {
    id?: string;
    call_state?: string | null;
    direction: "long" | "short";
    called_at: string;
    entry_price: number | null;
    target_price: number | null;
    price_at_call: number | null;
    vote_score: number;
    peak_return_pct?: number | null;
    closed_at?: string | null;
  },
  lastPrice: number
) {
  if (call.call_state === "pending_entry") {
    return {
      last_price: lastPrice,
      return_pct: null,
      peak_return_pct: null,
      target_progress: null,
      score_points: 0,
    };
  }

  return buildLiveCallMetricsUpdate(
    {
      id: call.id ?? "",
      direction: call.direction,
      called_at: call.called_at,
      entry_price: call.entry_price,
      target_price: call.target_price,
      price_at_call: call.price_at_call,
      vote_score: call.vote_score,
      peak_return_pct: call.peak_return_pct,
      closed_at: call.closed_at,
    },
    lastPrice
  );
}
