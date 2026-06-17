import { createServiceClient } from "@/lib/db/supabase";
import { shouldNotifyStopCross } from "@/lib/calls/stop-cross";
import { isDemoMode } from "@/lib/demo/config";
import { createNotification } from "@/lib/notifications/create-notification";
import { formatPrice } from "@/lib/utils";

const STOP_CROSS_KEY = "stop_crossed";

export type StopCrossProcessRow = {
  id: string;
  user_id: string;
  symbol: string;
  direction: "long" | "short";
  stop_price: number | null;
  closed_at?: string | null;
  last_price: number | null;
  entry_price: number | null;
  price_at_call: number | null;
  new_last_price: number;
};

async function recordStopCross(callId: string, userId: string): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from("call_milestones").insert({
    call_id: callId,
    user_id: userId,
    key: STOP_CROSS_KEY,
  } as never);

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[stop-cross/record]", error);
  return false;
}

export async function processCallStopCrosses(
  calls: StopCrossProcessRow[]
): Promise<{ notified: number }> {
  if (isDemoMode()) return { notified: 0 };

  let notified = 0;
  for (const call of calls) {
    if (!shouldNotifyStopCross(call, call.new_last_price)) continue;

    const isNew = await recordStopCross(call.id, call.user_id);
    if (!isNew) continue;

    const stopLabel = formatPrice(Number(call.stop_price));
    await createNotification({
      userId: call.user_id,
      type: "call_milestone",
      title: `${call.symbol} hit your stop`,
      body: `Price crossed your $${stopLabel} stop. Close this call to lock your track record return.`,
      href: `/ticker/${call.symbol}`,
      refCallId: call.id,
    });

    notified++;
  }

  return { notified };
}
