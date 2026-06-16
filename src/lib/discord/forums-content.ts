import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import { appIconUrl, hubBullets } from "@/lib/discord/hub-embed-helpers";

/** First embed title — bot uses this to find and refresh the forum guidelines message. */
export const FORUMS_MARKER_TITLE = "PortFuel — Pro forum standards";

export const FORUMS_MESSAGE_CONTENT =
  "📌 **Pro research forums** — structured deep dives for Pro members. _Pin this message · auto-updated by PortFuel._";

export function buildForumsEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");

  return [
    {
      author: { name: "PortFuel Intelligence", url: base },
      title: FORUMS_MARKER_TITLE,
      description:
        "> **One ticker · one thesis · one thread.**\n" +
        "> Tag correctly so members can scan and search.\n\n" +
        "_Educational research only — not investment advice._",
      color: DISCORD_COLORS.pro,
      thumbnail: { url: appIconUrl(base) },
      footer: { text: "PortFuel · Pro forums" },
    },
    {
      title: "◆  How to post",
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "Thread format",
          value: hubBullets([
            "**One symbol per thread** — use forum tags",
            "Lead with **direction**, **timeframe**, and **invalidation**",
            "Attach context: catalyst, levels, risk — not hype",
            "Mark **Solved** when the question is answered (mods may lock)",
          ]),
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Posting" },
    },
    {
      title: "◆  Suggested tags",
      description: "Create these in forum settings if they are not already present.",
      color: DISCORD_COLORS.digest,
      fields: [
        { name: "Thesis review", value: "Draft feedback", inline: true },
        { name: "Ticker deep-dive", value: "Single-symbol work", inline: true },
        { name: "Earnings / catalyst", value: "Event-driven", inline: true },
        { name: "Risk / macro", value: "Regime & sizing", inline: true },
        { name: "Product feedback", value: "Pro features", inline: true },
        { name: "Solved", value: "Resolved (mod)", inline: true },
      ],
      footer: { text: "PortFuel · Tags" },
    },
    {
      title: "◆  Standards",
      color: DISCORD_COLORS.brand,
      fields: [
        {
          name: "Keep it elite",
          value: hubBullets([
            "No pump language, guaranteed returns, or coordinated promotion",
            "Publish **timestamped calls** in the workspace — forums are for research",
            "Staff may remove low-effort threads or revoke forum access",
            "Full server rules in **#rules**",
          ]),
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Moderation" },
    },
  ];
}
