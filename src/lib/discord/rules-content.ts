import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import {
  HUB_RISK_DISCLAIMER,
  appIconUrl,
  hubBullets,
} from "@/lib/discord/hub-embed-helpers";

export const RULES_MARKER_TITLE = "PortFuel — Server standards";

export const RULES_LEGACY_MARKER_TITLES = ["PortFuel — Server rules"];

export function buildRulesMessageContent(appUrl: string): string {
  const terms = `${appUrl.replace(/\/$/, "")}/terms`;
  return (
    "📌 **Server standards** — by participating you agree to these rules and our " +
    `[Terms of Service](${terms}). _Pin this message · auto-updated by PortFuel._`
  );
}

export function buildRulesEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");
  const terms = `${base}/terms`;
  const privacy = `${base}/privacy`;
  const help = `${base}/dashboard/help`;

  return [
    {
      author: { name: "PortFuel Intelligence", url: base },
      title: RULES_MARKER_TITLE,
      url: terms,
      description:
        "> Professional community for **serious traders** — same bar as the workspace.\n\n" +
        HUB_RISK_DISCLAIMER,
      color: DISCORD_COLORS.brand,
      thumbnail: { url: appIconUrl(base) },
      footer: { text: "PortFuel · Server standards" },
    },
    {
      title: "◆  Conduct",
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "Respect & integrity",
          value: hubBullets([
            "Debate **ideas** — not people. No harassment, hate speech, or slurs",
            "No spam, scams, phishing, fake giveaways, or impersonation",
            "One PortFuel account per person — no ban evasion or quota gaming",
            `Protect privacy · [Privacy Policy](${privacy})`,
          ]),
          inline: false,
        },
        {
          name: "Trading & content",
          value: hubBullets([
            "Educational theses only — not recommendations to buy or sell",
            "No pump & dump, guaranteed returns, or coordinated promotion",
            "Publish timestamped calls in the **workspace** → **#member-calls** / **#fueled-calls**",
            "Bot DMs = product help only — not trade signals",
          ]),
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Conduct & content" },
    },
    {
      title: "◆  Channels & enforcement",
      description: "Use the right room. Staff may warn, mute, or ban for violations.",
      color: DISCORD_COLORS.digest,
      fields: [
        {
          name: "Read-only feeds",
          value:
            "**#member-calls** · **#fueled-calls** · **#targets-hit** · **#announcements**\n" +
            "_Bot posts only — reply in lounges_",
          inline: false,
        },
        {
          name: "Discussion",
          value: "**#general-chat** · **#member-chat** · **#pro-member-chat**",
          inline: true,
        },
        {
          name: "Research",
          value: "**pro-member-forums** — one ticker per thread",
          inline: true,
        },
        {
          name: "Appeals",
          value: `[Support ticket](${help}) · \`support@portfuel.pro\``,
          inline: true,
        },
      ],
      footer: { text: "PortFuel · Moderation" },
    },
  ];
}
