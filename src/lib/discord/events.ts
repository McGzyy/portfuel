import { createServiceClient } from "@/lib/db/supabase";
import {
  buildFueledCallEmbed,
  buildLinkWelcomeEmbed,
  buildMemberNewCallEmbed,
  buildMilestoneChatSnippetEmbed,
  buildTargetHitChannelEmbed,
} from "@/lib/discord/embed-payloads";
import { getAppUrl } from "@/lib/stripe/config";
import { getDiscordConfig } from "@/lib/discord/config";
import { resolveTierChatChannelId } from "@/lib/discord/milestone-channel";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

type CallDiscordContext = {
  symbol: string;
  direction: "long" | "short";
  entry_price: number | null;
  target_price: number | null;
  stop_price: number | null;
  return_pct: number | null;
  thesis: string;
  users: { username: string; display_name: string | null };
};

async function fetchCallDiscordContext(callId: string): Promise<CallDiscordContext | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "symbol, direction, entry_price, target_price, stop_price, return_pct, thesis, users!inner(username, display_name)"
    )
    .eq("id", callId)
    .maybeSingle();

  if (error || !data) return null;

  const usersRaw = (data as { users: unknown }).users;
  const users = (Array.isArray(usersRaw) ? usersRaw[0] : usersRaw) as {
    username: string;
    display_name: string | null;
  };

  return {
    symbol: (data as { symbol: string }).symbol,
    direction: (data as { direction: "long" | "short" }).direction,
    entry_price: (data as { entry_price: number | null }).entry_price,
    target_price: (data as { target_price: number | null }).target_price,
    stop_price: (data as { stop_price: number | null }).stop_price,
    return_pct: (data as { return_pct: number | null }).return_pct,
    thesis: (data as { thesis: string }).thesis,
    users,
  };
}

export async function notifyDiscordNewCall(input: {
  callId: string;
  symbol: string;
  direction: "long" | "short";
  isFueled: boolean;
  displayName: string | null;
  username: string;
  thesis?: string | null;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  returnPct?: number | null;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const appUrl = getAppUrl();
  const url = `${appUrl}/ticker/${encodeURIComponent(input.symbol)}`;

  if (input.isFueled && channels.fireCalls) {
    await enqueueDiscordOutbox({
      channelId: channels.fireCalls,
      eventType: "call.created.fueled",
      dedupeKey: `call:${input.callId}:fueled`,
      payload: {
        callId: input.callId,
        symbol: input.symbol,
        embed: buildFueledCallEmbed({
          symbol: input.symbol,
          direction: input.direction,
          url,
          displayName: input.displayName,
          thesis: input.thesis,
          entryPrice: input.entryPrice,
          targetPrice: input.targetPrice,
          stopPrice: input.stopPrice,
          returnPct: input.returnPct,
        }),
      },
    });
    return;
  }

  await enqueueDiscordOutbox({
    channelId: channels.calls,
    eventType: "call.created",
    dedupeKey: `call:${input.callId}:new`,
    payload: {
      callId: input.callId,
      symbol: input.symbol,
      embed: buildMemberNewCallEmbed({
        symbol: input.symbol,
        direction: input.direction,
        url,
        appUrl,
        username: input.username,
        displayName: input.displayName,
        thesis: input.thesis,
        entryPrice: input.entryPrice,
        targetPrice: input.targetPrice,
        stopPrice: input.stopPrice,
        returnPct: input.returnPct,
      }),
    },
  });
}

export async function notifyDiscordCallMilestone(input: {
  callId: string;
  userId: string;
  symbol: string;
  key: CallMilestoneKey;
  returnPct: number | null;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const appUrl = getAppUrl();
  const url = `${appUrl}/ticker/${encodeURIComponent(input.symbol)}`;
  const ctx = await fetchCallDiscordContext(input.callId);
  const username = ctx?.users.username ?? "member";
  const displayName = ctx?.users.display_name ?? null;
  const direction = ctx?.direction ?? "long";

  const milestoneLabel =
    input.key === "target_reached"
      ? "Target hit"
      : input.key === "return_10"
        ? "+10%"
        : input.key === "return_25"
          ? "+25%"
          : "+50%";

  const chatChannelId = await resolveTierChatChannelId(input.userId);
  const snippetEmbed = buildMilestoneChatSnippetEmbed({
    symbol: input.symbol,
    url,
    milestoneLabel,
    returnPct: input.returnPct,
    username,
    displayName,
    isTargetHit: input.key === "target_reached",
  });

  await enqueueDiscordOutbox({
    channelId: chatChannelId,
    eventType: input.key === "target_reached" ? "call.target_hit.snippet" : "call.milestone.snippet",
    dedupeKey: `milestone-snippet:${input.callId}:${input.key}`,
    payload: {
      callId: input.callId,
      symbol: input.symbol,
      milestone: input.key,
      embed: snippetEmbed,
    },
  });

  if (input.key === "target_reached" && channels.targets) {
    await enqueueDiscordOutbox({
      channelId: channels.targets,
      eventType: "call.target_hit",
      dedupeKey: `target-channel:${input.callId}`,
      payload: {
        callId: input.callId,
        symbol: input.symbol,
        milestone: input.key,
        attachChart: true,
        embed: buildTargetHitChannelEmbed({
          symbol: input.symbol,
          direction,
          url,
          username,
          displayName,
          returnPct: input.returnPct,
          entryPrice: ctx?.entry_price,
          targetPrice: ctx?.target_price,
          appUrl,
        }),
      },
    });
  }
}

export async function notifyDiscordAccountLinked(input: {
  displayName: string | null;
  username: string;
  isActive: boolean;
  isPro: boolean;
}): Promise<void> {
  if (!input.isActive) return;

  const { channels } = getDiscordConfig();
  const channelId = input.isPro ? channels.proMemberChat : channels.memberChat;
  const appUrl = getAppUrl();

  await enqueueDiscordOutbox({
    channelId,
    eventType: "member.linked",
    dedupeKey: `linked:${input.username}`,
    payload: {
      embed: buildLinkWelcomeEmbed({
        username: input.username,
        displayName: input.displayName,
        isPro: input.isPro,
        appUrl,
      }),
    },
  });
}
