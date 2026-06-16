import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import {
  HUB_DISCLAIMER,
  appIconUrl,
  hubBullets,
  hubChannel,
  hubTierLine,
} from "@/lib/discord/hub-embed-helpers";
import { PLAN_BY_TIER } from "@/lib/marketing/plans";

/** Bot matches this title to refresh the pinned hub message. */
export const OFFICIAL_LINKS_MARKER_TITLE = "PortFuel — Member hub";

/** Previous title — bot still updates the old pinned message after rebrand. */
export const OFFICIAL_LINKS_LEGACY_MARKER_TITLES = ["PortFuel — Start here"];

export const OFFICIAL_LINKS_MESSAGE_CONTENT =
  "📌 **Member hub** — workspace entry, onboarding, and server map. _Pin this message · auto-updated by PortFuel._";

export function buildOfficialLinksEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");
  const icon = appIconUrl(base);
  const join = `${base}/join`;
  const login = `${base}/login`;
  const dashboard = `${base}/dashboard`;
  const help = `${base}/dashboard/help`;
  const memberPlan = PLAN_BY_TIER.member;
  const proPlan = PLAN_BY_TIER.pro;

  return [
    {
      author: { name: "PortFuel Intelligence", url: base },
      title: OFFICIAL_LINKS_MARKER_TITLE,
      url: join,
      description:
        "> **Timestamped theses · Live marks · Ranked callers**\n" +
        "> The member workspace — plus this Discord for alerts and community.\n\n" +
        HUB_DISCLAIMER,
      color: DISCORD_COLORS.brand,
      thumbnail: { url: icon },
      fields: [
        { name: "Join", value: `[**Get access →**](${join})`, inline: true },
        { name: "Sign in", value: `[**Dashboard →**](${login})`, inline: true },
        { name: "Workspace", value: `[**Open app →**](${dashboard})`, inline: true },
      ],
      footer: { text: "PortFuel · Member hub" },
    },
    {
      title: "◆  Onboarding",
      description: "Three steps — then roles sync automatically.",
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "Steps",
          value: hubBullets([
            "**Verify** in **#verification** → unlock public channels",
            "**Link PortFuel** (logged in on portfuel.pro) → Member / Pro roles in ~60s",
            "Browse **#member-calls**, **#fueled-calls**, **#member-chat**",
            "**Help AI** — DM this bot · 5 preview Qs anyone · **40/mo** linked Pro",
          ]),
          inline: false,
        },
        {
          name: "Member",
          value: hubTierLine(
            memberPlan.name,
            memberPlan.price,
            memberPlan.period,
            "2 calls/wk · feed · desk · rankings"
          ),
          inline: true,
        },
        {
          name: "Pro Intelligence",
          value: hubTierLine(
            proPlan.name,
            proPlan.price,
            proPlan.period,
            "6 calls/wk · research terminal · Help AI"
          ),
          inline: true,
        },
        {
          name: "Billing",
          value: `[Compare plans](${join}) · **Settings → Plan & billing**`,
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Onboarding & plans" },
    },
    {
      title: "◆  Server map",
      description: "Bot feeds are read-only — discuss in lounges.",
      color: DISCORD_COLORS.digest,
      fields: [
        { name: "#announcements", value: "Weekly movers", inline: true },
        { name: "#general-chat", value: "Open community", inline: true },
        { name: "#rules", value: "Standards", inline: true },
        { name: "#member-calls", value: "Member theses", inline: true },
        { name: "#fueled-calls", value: "Desk calls", inline: true },
        { name: "#targets-hit", value: "Target reached", inline: true },
        { name: "#member-chat", value: "Member lounge", inline: true },
        { name: "#pro-member-chat", value: "Pro lounge", inline: true },
        { name: "pro-member-forums", value: "Deep dives", inline: true },
      ],
      footer: { text: "PortFuel · Channels" },
    },
    {
      title: "◆  Help & support",
      description: "Tickets and account issues live in the **workspace** — not in chat.",
      color: DISCORD_COLORS.milestone,
      fields: [
        { name: "Help center", value: `[Docs & guides](${help})`, inline: true },
        { name: "Open ticket", value: `[Support queue](${help})`, inline: true },
        { name: "Email", value: "`support@portfuel.pro`", inline: true },
        { name: "Quick answers", value: hubChannel("#faqs", "Discord & billing FAQs"), inline: true },
        { name: "Standards", value: hubChannel("#rules", "Community rules"), inline: true },
        { name: "Verify", value: hubChannel("#verification", "Unlock + link account"), inline: true },
      ],
      footer: { text: "PortFuel · Support" },
    },
  ];
}
