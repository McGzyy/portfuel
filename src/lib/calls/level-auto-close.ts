import { createServiceClient } from "@/lib/db/supabase";
import { autoCloseCallAtLevel } from "@/lib/calls/close-call";
import type { CallCloseReason } from "@/lib/calls/close-reason";
import {
  DEFAULT_CALL_EXIT_PREFS,
  fetchCallExitPrefsByUserIds,
  type CallExitPrefs,
} from "@/lib/calls/call-exit-prefs";
import { shouldNotifyStopCross, isPriceThroughStop } from "@/lib/calls/stop-cross";
import { shouldNotifyTargetCross, isPriceThroughTarget } from "@/lib/calls/target-cross";
import { isDemoMode } from "@/lib/demo/config";
import { createNotification } from "@/lib/notifications/create-notification";
import { formatPct, formatPrice } from "@/lib/utils";

const STOP_CROSS_KEY = "stop_crossed";
const TARGET_CROSS_KEY = "target_crossed";

export type LevelAutoCloseRow = {
  id: string;
  user_id: string;
  symbol: string;
  direction: "long" | "short";
  stop_price: number | null;
  target_price: number | null;
  closed_at?: string | null;
  last_price: number | null;
  entry_price: number | null;
  price_at_call: number | null;
  new_last_price: number;
  is_fueled: boolean;
};

async function recordLevelCross(
  callId: string,
  userId: string,
  key: typeof STOP_CROSS_KEY | typeof TARGET_CROSS_KEY
): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from("call_milestones").insert({
    call_id: callId,
    user_id: userId,
    key,
  } as never);

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[level-auto-close/record]", error);
  return false;
}

function evaluateAutoClose(
  call: LevelAutoCloseRow,
  prefs: CallExitPrefs
): { reason: "stop_hit" | "target_hit"; exitPrice: number } | null {
  if (call.is_fueled || call.closed_at) return null;

  if (
    prefs.autoCloseOnStop &&
    call.stop_price != null &&
    call.stop_price > 0 &&
    isPriceThroughStop(call.direction, call.new_last_price, Number(call.stop_price))
  ) {
    return { reason: "stop_hit", exitPrice: Number(call.stop_price) };
  }

  if (
    prefs.autoCloseOnTarget &&
    call.target_price != null &&
    call.target_price > 0 &&
    isPriceThroughTarget(call.direction, call.new_last_price, Number(call.target_price))
  ) {
    return { reason: "target_hit", exitPrice: Number(call.target_price) };
  }

  return null;
}

async function notifyManualCloseReminder(
  call: LevelAutoCloseRow,
  kind: "stop" | "target"
): Promise<void> {
  if (kind === "stop" && call.stop_price != null) {
    const stopLabel = formatPrice(Number(call.stop_price));
    await createNotification({
      userId: call.user_id,
      type: "call_milestone",
      title: `${call.symbol} hit your stop`,
      body: `Price crossed your $${stopLabel} stop. Close this call to lock your track record return.`,
      href: `/ticker/${call.symbol}`,
      refCallId: call.id,
    });
    return;
  }

  await createNotification({
    userId: call.user_id,
    type: "call_milestone",
    title: `${call.symbol} reached target`,
    body: "Price hit your stated target. Close the call on your book or ticker page to lock your return.",
    href: `/ticker/${call.symbol}`,
    refCallId: call.id,
  });
}

async function notifyAutoClosed(
  call: LevelAutoCloseRow,
  reason: CallCloseReason,
  returnPct: number | null,
  exitPrice: number
): Promise<void> {
  const retLabel = returnPct != null ? formatPct(returnPct) : "—";
  const priceLabel = formatPrice(exitPrice);

  if (reason === "stop_hit") {
    await createNotification({
      userId: call.user_id,
      type: "call_milestone",
      title: `${call.symbol} closed at your stop`,
      body: `Return locked at ${retLabel} · exit $${priceLabel}.`,
      href: `/dashboard/book`,
      refCallId: call.id,
    });
    return;
  }

  await createNotification({
    userId: call.user_id,
    type: "call_milestone",
    title: `${call.symbol} closed at your target`,
    body: `Return locked at ${retLabel} · exit $${priceLabel}.`,
    href: `/dashboard/book`,
    refCallId: call.id,
  });
}

export async function processCallLevelAutoCloses(
  calls: LevelAutoCloseRow[]
): Promise<{ closed: number; closedIds: Set<string>; manualReminders: number }> {
  if (isDemoMode()) {
    return { closed: 0, closedIds: new Set(), manualReminders: 0 };
  }

  const openCalls = calls.filter((c) => !c.closed_at && !c.is_fueled);
  if (openCalls.length === 0) {
    return { closed: 0, closedIds: new Set(), manualReminders: 0 };
  }

  const prefsMap = await fetchCallExitPrefsByUserIds(openCalls.map((c) => c.user_id));
  const closedIds = new Set<string>();
  let closed = 0;
  let manualReminders = 0;

  for (const call of openCalls) {
    if (closedIds.has(call.id)) continue;

    const prefs = prefsMap.get(call.user_id) ?? DEFAULT_CALL_EXIT_PREFS;
    const decision = evaluateAutoClose(call, prefs);

    if (decision) {
      const result = await autoCloseCallAtLevel(
        call.id,
        decision.exitPrice,
        decision.reason
      );
      if (!result.ok) continue;

      closedIds.add(call.id);
      closed++;
      await notifyAutoClosed(call, decision.reason, result.returnPct, decision.exitPrice);
      continue;
    }

    const stopCross =
      call.stop_price != null &&
      call.stop_price > 0 &&
      shouldNotifyStopCross(call, call.new_last_price);
    const targetCross =
      call.target_price != null &&
      call.target_price > 0 &&
      shouldNotifyTargetCross(call, call.new_last_price);

    if (stopCross && !prefs.autoCloseOnStop) {
      const isNew = await recordLevelCross(call.id, call.user_id, STOP_CROSS_KEY);
      if (isNew) {
        await notifyManualCloseReminder(call, "stop");
        manualReminders++;
      }
    } else if (targetCross && !prefs.autoCloseOnTarget) {
      const isNew = await recordLevelCross(call.id, call.user_id, TARGET_CROSS_KEY);
      if (isNew) {
        await notifyManualCloseReminder(call, "target");
        manualReminders++;
      }
    }
  }

  return { closed, closedIds, manualReminders };
}
