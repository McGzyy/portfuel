import { getAppUrl } from "@/lib/stripe/config";
import { getDiscordConfig } from "@/lib/discord/config";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

export async function notifyDiscordNewCall(input: {
  callId: string;
  symbol: string;
  direction: "long" | "short";
  isFueled: boolean;
  displayName: string | null;
  username: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const label = input.displayName?.trim() || input.username;
  const url = `${getAppUrl()}/ticker/${encodeURIComponent(input.symbol)}`;

  await enqueueDiscordOutbox({
    channelId: channels.calls,
    eventType: "call.created",
    payload: {
      symbol: input.symbol,
      direction: input.direction.toUpperCase(),
      isFueled: input.isFueled,
      by: label,
      username: input.username,
      url,
      callId: input.callId,
    },
  });

  if (input.isFueled && channels.fireCalls) {
    await enqueueDiscordOutbox({
      channelId: channels.fireCalls,
      eventType: "call.created",
      payload: {
        symbol: input.symbol,
        direction: input.direction.toUpperCase(),
        isFueled: true,
        by: label,
        username: input.username,
        url,
        callId: input.callId,
        text:
          `🔥 **FUELED CALL** — **${input.symbol}** ${input.direction.toUpperCase()} by ${label}\n${url}`,
      },
    });
  }
}

export async function notifyDiscordCallMilestone(input: {
  callId: string;
  symbol: string;
  key: CallMilestoneKey;
  returnPct: number | null;
  displayName?: string | null;
  username?: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const url = `${getAppUrl()}/ticker/${encodeURIComponent(input.symbol)}`;
  const who = input.displayName?.trim() || input.username || "A member";

  if (input.key === "target_reached") {
    await enqueueDiscordOutbox({
      channelId: channels.targets,
      eventType: "call.target_hit",
      payload: {
        symbol: input.symbol,
        returnPct: input.returnPct,
        url,
        callId: input.callId,
        by: who,
      },
    });
    return;
  }

  const label = input.key === "return_10" ? "+10%" : "+25%";
  const pct =
    input.returnPct != null ? ` (${input.returnPct >= 0 ? "+" : ""}${input.returnPct.toFixed(1)}%)` : "";

  await enqueueDiscordOutbox({
    channelId: channels.announcements,
    eventType: "call.milestone",
    payload: {
      text: `📈 **${input.symbol}** hit ${label}${pct} — ${who}\n${url}`,
    },
  });
}
