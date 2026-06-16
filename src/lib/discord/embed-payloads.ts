/** JSON-safe embed shape — rendered by discord-bot.mjs via EmbedBuilder. */

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

function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatReturnPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function thesisPreview(thesis: string | null | undefined, max = 220): string {
  const t = thesis?.trim();
  if (!t) return "_Thesis on PortFuel._";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function profileUrl(appUrl: string, username: string): string {
  return `${appUrl}/member/${encodeURIComponent(username)}`;
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
}): DiscordEmbedPayload {
  const dir = input.direction === "long" ? "LONG" : "SHORT";
  const who = input.displayName?.trim() || input.username;
  return {
    title: `${input.symbol} · ${dir}`,
    url: input.url,
    description: thesisPreview(input.thesis),
    color: input.direction === "long" ? DISCORD_COLORS.long : DISCORD_COLORS.short,
    fields: [
      { name: "Entry", value: formatUsd(input.entryPrice), inline: true },
      { name: "Target", value: formatUsd(input.targetPrice), inline: true },
      { name: "Stop", value: formatUsd(input.stopPrice), inline: true },
      {
        name: "Live",
        value: formatReturnPct(input.returnPct),
        inline: true,
      },
      {
        name: "Caller",
        value: `[${who}](${profileUrl(input.appUrl, input.username)})`,
        inline: true,
      },
      {
        name: "Chart",
        value: `[Open thesis →](${input.url})`,
        inline: true,
      },
    ],
    footer: { text: "PortFuel · New member call" },
  };
}

export function buildFueledCallEmbed(input: {
  symbol: string;
  direction: "long" | "short";
  url: string;
  displayName: string | null;
  thesis?: string | null;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  returnPct?: number | null;
}): DiscordEmbedPayload {
  const dir = input.direction === "long" ? "LONG" : "SHORT";
  const who = input.displayName?.trim() || "PortFuel Desk";
  return {
    author: { name: "Fueled Desk" },
    title: `🔥 ${input.symbol} · ${dir}`,
    url: input.url,
    description: thesisPreview(input.thesis),
    color: DISCORD_COLORS.fueled,
    fields: [
      { name: "Entry", value: formatUsd(input.entryPrice), inline: true },
      { name: "Target", value: formatUsd(input.targetPrice), inline: true },
      { name: "Stop", value: formatUsd(input.stopPrice), inline: true },
      { name: "Live", value: formatReturnPct(input.returnPct), inline: true },
      { name: "Desk", value: who, inline: true },
      { name: "Research", value: `[Read thesis →](${input.url})`, inline: true },
    ],
    footer: { text: "PortFuel · Official desk call" },
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
}): DiscordEmbedPayload {
  const who = input.displayName?.trim() || input.username;
  return {
    title: `🎯 ${input.symbol} · Target reached`,
    url: input.url,
    description: `**${who}**'s ${input.direction.toUpperCase()} thesis hit its stated target. Close on PortFuel to lock the return.`,
    color: DISCORD_COLORS.target,
    fields: [
      { name: "Return", value: formatReturnPct(input.returnPct), inline: true },
      { name: "Entry", value: formatUsd(input.entryPrice), inline: true },
      { name: "Target", value: formatUsd(input.targetPrice), inline: true },
      {
        name: "Profile",
        value: `[${who}](${profileUrl(input.appUrl, input.username)})`,
        inline: true,
      },
      {
        name: "Action",
        value: `[View chart & close →](${input.url})`,
        inline: false,
      },
    ],
    footer: { text: "PortFuel · Target hit" },
  };
}

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
    input.returnPct != null
      ? ` (${formatReturnPct(input.returnPct)})`
      : "";
  return {
    description: `**${input.symbol}** — ${input.milestoneLabel}${ret} — ${who}\n[View on PortFuel](${input.url})`,
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
  return {
    title: "Workspace linked",
    description: `**${who}** connected their PortFuel account.`,
    color: input.isPro ? DISCORD_COLORS.pro : DISCORD_COLORS.member,
    fields: [
      { name: "Tier", value: tier, inline: true },
      { name: "Handle", value: `@${input.username}`, inline: true },
      {
        name: "Profile",
        value: `[portfuel.pro/member/${input.username}](${profileUrl(input.appUrl, input.username)})`,
        inline: false,
      },
    ],
    footer: { text: "PortFuel · Roles sync within 60 seconds" },
  };
}

export function buildWeeklyDigestEmbed(input: {
  movers: {
    symbol: string;
    direction: string;
    returnPct: number;
    isFueled: boolean;
    who: string;
  }[];
  feedUrl: string;
}): DiscordEmbedPayload {
  if (input.movers.length === 0) {
    return {
      title: "Weekly digest",
      description:
        "No standout movers in the member feed this week.\n\n[Browse latest calls →](" +
        input.feedUrl +
        ")",
      color: DISCORD_COLORS.digest,
      footer: { text: "PortFuel · Weekly digest" },
    };
  }

  const lines = input.movers.map((m, i) => {
    const fueled = m.isFueled ? " 🔥" : "";
    const ret = formatReturnPct(m.returnPct);
    return `**${i + 1}.** ${m.symbol} ${m.direction.toUpperCase()} **${ret}**${fueled} — ${m.who}`;
  });

  return {
    title: "Weekly movers",
    description: lines.join("\n"),
    url: input.feedUrl,
    color: DISCORD_COLORS.digest,
    footer: { text: "PortFuel · Last 7 days · Top member calls" },
  };
}
