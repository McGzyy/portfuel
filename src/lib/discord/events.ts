import { createServiceClient } from "@/lib/db/supabase";
import { milestonePostContent } from "@/lib/discord/call-embed-helpers";
import {
  fueledCallDiscordContent,
  getDiscordDisclaimerMarkdown,
  memberNewCallDiscordContent,
  memberSpotlightDiscordContent,
  targetHitDiscordContent,
} from "@/lib/discord/discord-copy";
import {
  buildFueledCallEmbed,
  buildLinkWelcomeEmbed,
  buildMemberNewCallEmbed,
  buildMemberSpotlightEmbed,
  buildMilestoneChatEmbed,
  buildTargetHitChannelEmbed,
} from "@/lib/discord/embed-payloads";
import { resolveCallEmbedThumbnail } from "@/lib/discord/hub-embed-helpers";
import { getAppUrl } from "@/lib/stripe/config";
import { getDiscordConfig } from "@/lib/discord/config";
import { resolveTierChatChannelId } from "@/lib/discord/milestone-channel";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

type CallDiscordContext = {
  symbol: string;
  direction: "long" | "short";
  is_fueled: boolean;
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
      "symbol, direction, is_fueled, entry_price, target_price, stop_price, return_pct, thesis, users!inner(username, display_name)"
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
    is_fueled: Boolean((data as { is_fueled?: boolean }).is_fueled),
    entry_price: (data as { entry_price: number | null }).entry_price,
    target_price: (data as { target_price: number | null }).target_price,
    stop_price: (data as { stop_price: number | null }).stop_price,
    return_pct: (data as { return_pct: number | null }).return_pct,
    thesis: (data as { thesis: string }).thesis,
    users,
  };
}

function milestoneAttachChart(key: CallMilestoneKey, isFueled: boolean): boolean {
  if (key === "target_reached") return true;
  if (isFueled && (key === "return_25" || key === "return_50")) return true;
  return false;
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
  const [thumbnailUrl, disclaimer] = await Promise.all([
    resolveCallEmbedThumbnail(input.symbol, appUrl),
    getDiscordDisclaimerMarkdown(),
  ]);

  if (input.isFueled && channels.fireCalls) {
    await enqueueDiscordOutbox({
      channelId: channels.fireCalls,
      eventType: "call.created.fueled",
      dedupeKey: `call:${input.callId}:fueled`,
      payload: {
        callId: input.callId,
        symbol: input.symbol,
        content: await fueledCallDiscordContent(),
        attachChart: true,
        embed: buildFueledCallEmbed({
          symbol: input.symbol,
          direction: input.direction,
          url,
          appUrl,
          displayName: input.displayName,
          thesis: input.thesis,
          entryPrice: input.entryPrice,
          targetPrice: input.targetPrice,
          stopPrice: input.stopPrice,
          returnPct: input.returnPct,
          thumbnailUrl,
          disclaimer,
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
      content: await memberNewCallDiscordContent(),
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
        thumbnailUrl,
        disclaimer,
      }),
    },
  });
}

export async function notifyDiscordMemberSpotlight(input: { callId: string }): Promise<void> {
  const ctx = await fetchCallDiscordContext(input.callId);
  if (!ctx || ctx.is_fueled) return;

  const { channels } = getDiscordConfig();
  const appUrl = getAppUrl();
  const url = `${appUrl}/ticker/${encodeURIComponent(ctx.symbol)}`;
  const [thumbnailUrl, disclaimer] = await Promise.all([
    resolveCallEmbedThumbnail(ctx.symbol, appUrl),
    getDiscordDisclaimerMarkdown(),
  ]);

  await enqueueDiscordOutbox({
    channelId: channels.calls,
    eventType: "member.spotlight",
    dedupeKey: `member-spotlight:${input.callId}`,
    payload: {
      callId: input.callId,
      symbol: ctx.symbol,
      content: await memberSpotlightDiscordContent(ctx.symbol),
      attachChart: true,
      memberWin: true,
      embed: buildMemberSpotlightEmbed({
        symbol: ctx.symbol,
        direction: ctx.direction,
        url,
        appUrl,
        username: ctx.users.username,
        displayName: ctx.users.display_name,
        returnPct: ctx.return_pct,
        thesis: ctx.thesis,
        entryPrice: ctx.entry_price,
        targetPrice: ctx.target_price,
        stopPrice: ctx.stop_price,
        thumbnailUrl,
        disclaimer,
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
  const isFueled = ctx?.is_fueled ?? false;
  const [thumbnailUrl, disclaimer] = await Promise.all([
    resolveCallEmbedThumbnail(input.symbol, appUrl),
    getDiscordDisclaimerMarkdown(),
  ]);

  const chatChannelId = await resolveTierChatChannelId(input.userId);
  const chatEmbed = buildMilestoneChatEmbed({
    symbol: input.symbol,
    direction,
    url,
    milestone: input.key,
    returnPct: input.returnPct,
    username,
    displayName,
    appUrl,
    isFueled,
    entryPrice: ctx?.entry_price,
    targetPrice: ctx?.target_price,
    thumbnailUrl,
  });

  await enqueueDiscordOutbox({
    channelId: chatChannelId,
    eventType: input.key === "target_reached" ? "call.target_hit.snippet" : "call.milestone.snippet",
    dedupeKey: `milestone-snippet:${input.callId}:${input.key}`,
    payload: {
      callId: input.callId,
      symbol: input.symbol,
      milestone: input.key,
      content: milestonePostContent(input.key, input.symbol),
      attachChart: milestoneAttachChart(input.key, isFueled),
      embed: chatEmbed,
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
        content: targetHitDiscordContent(input.symbol),
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
          isFueled,
          thumbnailUrl,
          disclaimer,
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
      content: "✅ **Member connected**",
      embed: buildLinkWelcomeEmbed({
        username: input.username,
        displayName: input.displayName,
        isPro: input.isPro,
        appUrl,
      }),
    },
  });
}
