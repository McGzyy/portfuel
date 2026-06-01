import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { notifyDiscordCallMilestone } from "@/lib/discord/events";
import { createNotification } from "@/lib/notifications/service";

export type CallMilestoneKey = "return_10" | "return_25" | "target_reached";

type CallRow = {
  id: string;
  user_id: string;
  symbol: string;
  direction: string;
  entry_price: number | null;
  target_price: number | null;
  return_pct: number | null;
  target_progress: number | null;
};

function milestonesForCall(call: CallRow): CallMilestoneKey[] {
  const keys: CallMilestoneKey[] = [];
  const ret = call.return_pct;
  if (ret != null) {
    if (ret >= 10) keys.push("return_10");
    if (ret >= 25) keys.push("return_25");
  }
  if (
    call.entry_price != null &&
    call.target_price != null &&
    call.target_progress != null &&
    call.target_progress >= 100
  ) {
    keys.push("target_reached");
  }
  return keys;
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
        body: `Your call is up ${returnPct?.toFixed(1) ?? "25"}% since entry.`,
      };
    case "target_reached":
      return {
        title: `${symbol} reached target`,
        body: "Price has reached your stated target on this call.",
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
    if (keys.length === 0) continue;

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
        symbol: call.symbol,
        key,
        returnPct: call.return_pct,
      }).catch((e) => console.error("[discord/milestone]", e));

      notified++;
    }
  }
  return { notified };
}
