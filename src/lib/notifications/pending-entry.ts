import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { createNotification } from "@/lib/notifications/service";
import { formatPrice } from "@/lib/utils";

export const PENDING_ENTRY_ACTIVATED_KEY = "pending_entry_activated";
export const PENDING_ENTRY_EXPIRING_KEY = "pending_entry_expiring";
export const PENDING_ENTRY_EXPIRED_KEY = "pending_entry_expired";

type PendingNotifyCall = {
  id: string;
  user_id: string;
  symbol: string;
  direction: "long" | "short";
  trigger_entry_price: number | null;
};

async function recordPendingMilestone(
  callId: string,
  userId: string,
  key: string
): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from("call_milestones").insert({
    call_id: callId,
    user_id: userId,
    key,
  } as never);

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[pending-entry/notify]", error);
  return false;
}

export async function notifyPendingEntryActivated(
  call: PendingNotifyCall,
  lastPrice: number
): Promise<void> {
  if (isDemoMode()) return;

  const isNew = await recordPendingMilestone(
    call.id,
    call.user_id,
    PENDING_ENTRY_ACTIVATED_KEY
  );
  if (!isNew) return;

  const trigger =
    call.trigger_entry_price != null ? formatPrice(Number(call.trigger_entry_price)) : "—";

  await createNotification({
    userId: call.user_id,
    type: "call_milestone",
    title: `${call.symbol} entry triggered`,
    body: `Your ${call.direction} call activated at $${trigger}. Last price $${formatPrice(lastPrice)}.`,
    href: `/ticker/${call.symbol}`,
    refCallId: call.id,
  });
}

export async function notifyPendingEntryExpiring(
  call: PendingNotifyCall,
  daysLeft: number
): Promise<void> {
  if (isDemoMode()) return;

  const isNew = await recordPendingMilestone(
    call.id,
    call.user_id,
    PENDING_ENTRY_EXPIRING_KEY
  );
  if (!isNew) return;

  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;

  await createNotification({
    userId: call.user_id,
    type: "call_milestone",
    title: `${call.symbol} pending call expiring soon`,
    body: `Your conditional entry expires in ${dayLabel} if price never reaches your trigger.`,
    href: `/ticker/${call.symbol}`,
    refCallId: call.id,
  });
}

export async function notifyPendingEntryExpired(call: PendingNotifyCall): Promise<void> {
  if (isDemoMode()) return;

  const isNew = await recordPendingMilestone(
    call.id,
    call.user_id,
    PENDING_ENTRY_EXPIRED_KEY
  );
  if (!isNew) return;

  await createNotification({
    userId: call.user_id,
    type: "call_milestone",
    title: `${call.symbol} pending call expired`,
    body: "Your conditional entry was removed after 30 days without a trigger.",
    href: `/ticker/${call.symbol}`,
    refCallId: call.id,
  });
}
