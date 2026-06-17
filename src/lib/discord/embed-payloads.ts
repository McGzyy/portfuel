/** JSON-safe embed shape — rendered by discord-bot.mjs via EmbedBuilder. */

import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import {
  CALL_POST_DISCLAIMER,
  callDirectionLabel,
  callLevelsLine,
  callThesisQuote,
  formatReturnPct,
  formatUsd,
  milestoneDisplayLabel,
  profileUrl,
} from "@/lib/discord/call-embed-helpers";
import { appIconUrl } from "@/lib/discord/hub-embed-helpers";
import type { WeeklyDigestRow } from "@/lib/social/weekly-digest";
import { formatWeeklyDigestLineDiscord } from "@/lib/social/weekly-digest";

export type DiscordEmbedPayload = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  author?: { name: string; url?: string };
  thumbnail?: { url: string };
};

export const DISCORD_COLORS = {
  brand: 0xe31b23,
  long: 0x059669,
  short: 0xb91c1c,
  fueled: 0xe31b23,
  target: 0x047857,
  milestone: 0x1d4ed8,
  member: 0x334155,
  pro: 0x7c3aed,
  digest: 0x0f172a,
} as const;

/** Text above the embed in the channel (optional). */
export function memberNewCallPostContent(): string {
  return "📣 **New member call** · _Timestamped on PortFuel_";
}

export function fueledCallPostContent(): string {
  return "🔥 **Official desk call** · _Fueled thesis_";
}

export function memberSpotlightPostContent(symbol: string): string {
  return `⭐ **Member spotlight** · **${symbol}** on record`;
}

export function targetHitPostContent(symbol: string): string {
  return `🎯 **Target reached** · **${symbol}**`;
}

export function buildMemberNewCallEmbed(input: {
  symbol: string;
  direction: "long" | "short";
  url: string;
  appUrl: string;
  username: string;
  displayName: string | null;
  thesis?: string | null;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  returnPct?: number | null;
  thumbnailUrl?: string;
  disclaimer?: string;
}): DiscordEmbedPayload {
  const dir = callDirectionLabel(input.direction);
  const who = input.displayName?.trim() || input.username;
  const profile = profileUrl(input.appUrl, input.username);
  const disclaimer = input.disclaimer ?? CALL_POST_DISCLAIMER;

  return {
    author: { name: who, url: profile },
    title: `${input.symbol} · ${dir}`,
    url: input.url,
    description: `${callThesisQuote(input.thesis)}\n\n${disclaimer}`,
    color: input.direction === "long" ? DISCORD_COLORS.long : DISCORD_COLORS.short,
    thumbnail: { url: input.thumbnailUrl ?? appIconUrl(input.appUrl) },
    fields: [
      {
        name: "◆  Levels",
        value: callLevelsLine(input),
        inline: false,
      },
      {
        name: "Live mark",
        value: formatReturnPct(input.returnPct),
        inline: true,
      },
      {
        name: "Caller",
        value: `[@${input.username}](${profile})`,
        inline: true,
      },
      {
        name: "Thesis",
        value: `[Open chart & thesis →](${input.url})`,
        inline: true,
      },
    ],
    footer: { text: "PortFuel · Member call" },
  };
}

export function buildFueledCallEmbed(input: {
  symbol: string;
  direction: "long" | "short";
  url: string;
  appUrl: string;
  displayName: string | null;
  thesis?: string | null;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  returnPct?: number | null;
  thumbnailUrl?: string;
  disclaimer?: string;
}): DiscordEmbedPayload {
  const dir = callDirectionLabel(input.direction);
  const desk = input.displayName?.trim() || "PortFuel Desk";
  const disclaimer = input.disclaimer ?? CALL_POST_DISCLAIMER;

  return {
    author: { name: "Fueled Desk", url: input.appUrl.replace(/\/$/, "") },
    title: `${input.symbol} · ${dir}`,
    url: input.url,
    description: `${callThesisQuote(input.thesis)}\n\n${disclaimer}`,
    color: DISCORD_COLORS.fueled,
    thumbnail: { url: input.thumbnailUrl ?? appIconUrl(input.appUrl) },
    fields: [
      {
        name: "◆  Levels",
        value: callLevelsLine(input),
        inline: false,
      },
      {
        name: "Live mark",
        value: formatReturnPct(input.returnPct),
        inline: true,
      },
      {
        name: "Desk",
        value: desk,
        inline: true,
      },
      {
        name: "Research",
        value: `[Read full thesis →](${input.url})`,
        inline: true,
      },
    ],
    footer: { text: "PortFuel · Fueled desk call" },
  };
}

export function buildTargetHitChannelEmbed(input: {
  symbol: string;
  direction: "long" | "short";
  url: string;
  username: string;
  displayName: string | null;
  returnPct: number | null;
  entryPrice?: number | null;
  targetPrice?: number | null;
  appUrl: string;
  isFueled?: boolean;
  thumbnailUrl?: string;
  disclaimer?: string;
}): DiscordEmbedPayload {
  const who = input.displayName?.trim() || input.username;
  const profile = profileUrl(input.appUrl, input.username);
  const dir = callDirectionLabel(input.direction);
  const fueledTag = input.isFueled ? " · Fueled desk" : "";
  const disclaimer = input.disclaimer ?? CALL_POST_DISCLAIMER;

  return {
    author: { name: who, url: profile },
    title: `${input.symbol} · ${dir} · Target hit`,
    url: input.url,
    description:
      `> **${formatReturnPct(input.returnPct)}** at target — ` +
      `${who}'s thesis reached its stated price.\n` +
      `> Close on PortFuel to lock the return.\n\n` +
      disclaimer,
    color: DISCORD_COLORS.target,
    thumbnail: { url: input.thumbnailUrl ?? appIconUrl(input.appUrl) },
    fields: [
      {
        name: "◆  Result",
        value: `**Return** ${formatReturnPct(input.returnPct)} · **Entry** ${formatUsd(input.entryPrice)} → **Target** ${formatUsd(input.targetPrice)}`,
        inline: false,
      },
      {
        name: "Caller",
        value: `[@${input.username}](${profile})`,
        inline: true,
      },
      {
        name: "Action",
        value: `[View chart & close →](${input.url})`,
        inline: true,
      },
    ],
    footer: { text: `PortFuel · Target reached${fueledTag}` },
  };
}

export function buildMilestoneChatEmbed(input: {
  symbol: string;
  direction: "long" | "short";
  url: string;
  milestone: CallMilestoneKey;
  returnPct: number | null;
  username: string;
  displayName: string | null;
  appUrl: string;
  isFueled?: boolean;
  entryPrice?: number | null;
  targetPrice?: number | null;
  thumbnailUrl?: string;
}): DiscordEmbedPayload {
  const who = input.displayName?.trim() || input.username;
  const profile = profileUrl(input.appUrl, input.username);
  const label = milestoneDisplayLabel(input.milestone);
  const dir = callDirectionLabel(input.direction);
  const isTarget = input.milestone === "target_reached";
  const fueled = input.isFueled ? " · Fueled" : "";

  return {
    author: { name: who, url: profile },
    title: `${input.symbol} · ${dir} · ${label}`,
    url: input.url,
    description:
      `> **${formatReturnPct(input.returnPct)}** since entry` +
      (isTarget ? " — price at stated target." : ".") +
      `\n\n[View on PortFuel →](${input.url})`,
    color: isTarget ? DISCORD_COLORS.target : DISCORD_COLORS.milestone,
    thumbnail: input.thumbnailUrl ? { url: input.thumbnailUrl } : undefined,
    fields: [
      {
        name: "◆  Snapshot",
        value: callLevelsLine({
          entryPrice: input.entryPrice,
          targetPrice: input.targetPrice,
          stopPrice: null,
        }),
        inline: false,
      },
      {
        name: "Caller",
        value: `[@${input.username}](${profile})`,
        inline: true,
      },
      {
        name: "Return",
        value: formatReturnPct(input.returnPct),
        inline: true,
      },
    ],
    footer: { text: `PortFuel · Live update${fueled}` },
  };
}

export function buildMemberSpotlightEmbed(input: {
  symbol: string;
  direction: "long" | "short";
  url: string;
  appUrl: string;
  username: string;
  displayName: string | null;
  returnPct: number | null;
  thesis?: string | null;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  thumbnailUrl?: string;
  disclaimer?: string;
}): DiscordEmbedPayload {
  const dir = callDirectionLabel(input.direction);
  const who = input.displayName?.trim() || input.username;
  const profile = profileUrl(input.appUrl, input.username);
  const disclaimer = input.disclaimer ?? CALL_POST_DISCLAIMER;

  return {
    author: { name: who, url: profile },
    title: `${input.symbol} · ${dir} · Member spotlight`,
    url: input.url,
    description:
      `> **${formatReturnPct(input.returnPct)}** on record — ` +
      `community call highlighted with member consent.\n\n` +
      `${callThesisQuote(input.thesis)}\n\n` +
      disclaimer,
    color: input.direction === "long" ? DISCORD_COLORS.long : DISCORD_COLORS.short,
    thumbnail: { url: input.thumbnailUrl ?? appIconUrl(input.appUrl) },
    fields: [
      {
        name: "◆  Levels",
        value: callLevelsLine(input),
        inline: false,
      },
      {
        name: "Return",
        value: formatReturnPct(input.returnPct),
        inline: true,
      },
      {
        name: "Caller",
        value: `[@${input.username}](${profile})`,
        inline: true,
      },
      {
        name: "Chart",
        value: `[Open thesis →](${input.url})`,
        inline: true,
      },
    ],
    footer: { text: "PortFuel · Member spotlight" },
  };
}

/** @deprecated Use buildMilestoneChatEmbed — kept for type compatibility during migration */
export function buildMilestoneChatSnippetEmbed(input: {
  symbol: string;
  url: string;
  milestoneLabel: string;
  returnPct: number | null;
  username: string;
  displayName: string | null;
  isTargetHit?: boolean;
}): DiscordEmbedPayload {
  const who = input.displayName?.trim() || `@${input.username}`;
  const ret =
    input.returnPct != null ? ` · **${formatReturnPct(input.returnPct)}**` : "";
  return {
    title: `${input.symbol} · ${input.milestoneLabel}`,
    url: input.url,
    description: `**${who}**${ret}\n\n[View on PortFuel →](${input.url})`,
    color: input.isTargetHit ? DISCORD_COLORS.target : DISCORD_COLORS.milestone,
    footer: { text: "PortFuel · Live update" },
  };
}

export function buildLinkWelcomeEmbed(input: {
  username: string;
  displayName: string | null;
  isPro: boolean;
  appUrl: string;
}): DiscordEmbedPayload {
  const who = input.displayName?.trim() || input.username;
  const tier = input.isPro ? "Pro Intelligence" : "Member";
  const profile = profileUrl(input.appUrl, input.username);

  return {
    title: "◆  Workspace linked",
    description: `**${who}** connected their PortFuel account.\n\nRoles sync within ~60 seconds.`,
    color: input.isPro ? DISCORD_COLORS.pro : DISCORD_COLORS.member,
    thumbnail: { url: appIconUrl(input.appUrl) },
    fields: [
      { name: "Tier", value: tier, inline: true },
      { name: "Handle", value: `@${input.username}`, inline: true },
      {
        name: "Profile",
        value: `[portfuel.pro/member/${input.username}](${profile})`,
        inline: false,
      },
    ],
    footer: { text: "PortFuel · Member connected" },
  };
}

export function buildWeeklyDigestEmbed(input: {
  rows: WeeklyDigestRow[];
  feedUrl: string;
  appUrl?: string;
  disclaimer?: string;
}): DiscordEmbedPayload {
  if (input.rows.length === 0) {
    return {
      title: "◆  Weekly digest",
      description:
        "> No standout movers in the member feed this week.\n\n" +
        `[Browse latest calls →](${input.feedUrl})`,
      color: DISCORD_COLORS.digest,
      footer: { text: "PortFuel · Weekly digest" },
    };
  }

  const lines = input.rows.map((row, i) => formatWeeklyDigestLineDiscord(row, i));
  const disclaimer = input.disclaimer ? `\n\n${input.disclaimer}` : "";

  return {
    title: "◆  Weekly movers",
    description: `> Top community calls · last 7 days\n\n${lines.join("\n")}${disclaimer}`,
    url: input.feedUrl,
    color: DISCORD_COLORS.digest,
    thumbnail: input.appUrl ? { url: appIconUrl(input.appUrl) } : undefined,
    footer: { text: "PortFuel · Weekly digest" },
  };
}
