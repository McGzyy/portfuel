import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { notifyDiscordCallMilestone } from "@/lib/discord/events";
import { tryAutopostFueledMilestone } from "@/lib/social/x-milestone-autopost";
import { tryAutopostMemberStillRunning } from "@/lib/social/x-member-win-still-running";
import { tryAutopostMemberWinUpdate } from "@/lib/social/x-member-win-update";
import { createNotification } from "@/lib/notifications/service";
import {
  callMilestoneKeysForCall,
  type CallMilestoneKey,
} from "@/lib/notifications/milestone-keys";

export type { CallMilestoneKey } from "@/lib/notifications/milestone-keys";

type CallRow = {
  id: string;
  user_id: string;
  symbol: string;
  direction: string;
  is_fueled?: boolean;
  entry_price: number | null;
  target_price: number | null;
  return_pct: number | null;
  target_progress: number | null;
};

function milestonesForCall(call: CallRow): CallMilestoneKey[] {
  return callMilestoneKeysForCall(call);
}

function copyForMilestone(
  key: CallMilestoneKey,
  symbol: string,
  returnPct: number | null
): { title: string; body: string } {
  switch (key) {
    case "return_10":
      return {
        title: `${symbol} hit +10%`,
        body: `Your call is up ${returnPct?.toFixed(1) ?? "10"}% since entry.`,
      };
    case "return_25":
      return {
        title: `${symbol} hit +25%`,
        body: `Your call is up ${returnPct?.toFixed(1) ?? "25"}% since entry. Feature it on @PortFuel from this call card.`,
      };
    case "return_50":
      return {
        title: `${symbol} hit +50%`,
        body: `Your call is up ${returnPct?.toFixed(1) ?? "50"}% since entry.`,
      };
    case "target_reached":
      return {
        title: `${symbol} reached target`,
        body: "Price hit your stated target. Close the call on your book or ticker page to lock your return.",
      };
  }
}

async function recordMilestone(
  callId: string,
  userId: string,
  key: CallMilestoneKey
): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from("call_milestones").insert({
    call_id: callId,
    user_id: userId,
    key,
  } as never);

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[milestones/record]", error);
  return false;
}

export async function processCallMilestones(calls: CallRow[]): Promise<{ notified: number }> {
  if (isDemoMode()) return { notified: 0 };

  let notified = 0;
  for (const call of calls) {
    const keys = milestonesForCall(call);

    for (const key of keys) {
      const isNew = await recordMilestone(call.id, call.user_id, key);
      if (!isNew) continue;

      const copy = copyForMilestone(key, call.symbol, call.return_pct);
      await createNotification({
        userId: call.user_id,
        type: "call_milestone",
        title: copy.title,
        body: copy.body,
        href: `/ticker/${call.symbol}`,
        refCallId: call.id,
      });

      void notifyDiscordCallMilestone({
        callId: call.id,
        userId: call.user_id,
        symbol: call.symbol,
        key,
        returnPct: call.return_pct,
      }).catch((e) => console.error("[discord/milestone]", e));

      void tryAutopostFueledMilestone(call.id, key).catch((e) =>
        console.error("[x/milestone-autopost]", e)
      );

      void tryAutopostMemberWinUpdate(call.id, key, {
        isFueled: Boolean(call.is_fueled),
      }).catch((e) => console.error("[x/member-win-update]", e));

      notified++;
    }

    void tryAutopostMemberStillRunning({
      id: call.id,
      is_fueled: call.is_fueled,
      return_pct: call.return_pct,
    }).catch((e) => console.error("[x/member-win-still-running]", e));
  }
  return { notified };
}
