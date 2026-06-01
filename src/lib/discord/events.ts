import { getAppUrl } from "@/lib/stripe/config";
import { getDiscordConfig } from "@/lib/discord/config";
import { resolveTierChatChannelId } from "@/lib/discord/milestone-channel";
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
  userId: string;
  symbol: string;
  key: CallMilestoneKey;
  returnPct: number | null;
  displayName?: string | null;
  username?: string;
}): Promise<void> {
  const url = `${getAppUrl()}/ticker/${encodeURIComponent(input.symbol)}`;
  const who = input.displayName?.trim() || input.username || "A member";
  const channelId = await resolveTierChatChannelId(input.userId);

  const milestoneLabel =
    input.key === "target_reached"
      ? "Target hit"
      : input.key === "return_10"
        ? "+10%"
        : "+25%";
  const pct =
    input.returnPct != null
      ? ` (${input.returnPct >= 0 ? "+" : ""}${input.returnPct.toFixed(1)}%)`
      : "";

  const eventType =
    input.key === "target_reached" ? "call.target_hit" : "call.milestone";

  await enqueueDiscordOutbox({
    channelId,
    eventType,
    payload: {
      symbol: input.symbol,
      returnPct: input.returnPct,
      url,
      callId: input.callId,
      milestone: input.key,
      attachChart: true,
      by: who,
      milestoneLabel,
      text: `📈 **${input.symbol}** — ${milestoneLabel}${pct} — ${who}\n${url}`,
    },
  });
}

export async function notifyDiscordAccountLinked(input: {
  displayName: string | null;
  username: string;
  isActive: boolean;
  isPro: boolean;
}): Promise<void> {
  if (!input.isActive) return;

  const { channels } = getDiscordConfig();
  const label = input.displayName?.trim() || input.username;
  const tier = input.isPro ? "Pro Member" : "PortFuel Member";
  const channelId = input.isPro ? channels.proMemberChat : channels.memberChat;

  await enqueueDiscordOutbox({
    channelId,
    eventType: "member.linked",
    payload: {
      text: `✅ **${label}** (@${input.username}) linked PortFuel — **${tier}**. Roles sync within a minute.`,
    },
  });
}
