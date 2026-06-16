import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import { PLAN_BY_TIER } from "@/lib/marketing/plans";

/** First embed title — bot uses this to find and refresh the pinned hub message. */
export const OFFICIAL_LINKS_MARKER_TITLE = "PortFuel — Start here";

/** Short line above the embed stack in #official-links. */
export const OFFICIAL_LINKS_MESSAGE_CONTENT =
  "**Official hub** — links, onboarding, and channel map. _Updated automatically by the PortFuel bot._";

export function buildOfficialLinksEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");
  const join = `${base}/join`;
  const login = `${base}/login`;
  const dashboard = `${base}/dashboard`;
  const help = `${base}/dashboard/help`;
  const memberPlan = PLAN_BY_TIER.member;
  const proPlan = PLAN_BY_TIER.pro;

  return [
    {
      author: { name: "PortFuel", url: base },
      title: OFFICIAL_LINKS_MARKER_TITLE,
      url: join,
      description:
        "Member intelligence workspace for **timestamped theses**, **live performance**, and **community rankings**.\n\n" +
        "_Educational content only — not investment advice._",
      color: DISCORD_COLORS.brand,
      fields: [
        { name: "Join", value: `[portfuel.pro/join](${join})`, inline: true },
        { name: "Log in", value: `[Dashboard](${login})`, inline: true },
        { name: "Workspace", value: `[Open app](${dashboard})`, inline: true },
      ],
      footer: { text: "PortFuel · Official links" },
    },
    {
      title: "Discord setup",
      description:
        "Complete these steps once to unlock member channels and sync your PortFuel roles.",
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "1 · Verify",
          value: "Go to **#verification** → click **Verify**",
          inline: false,
        },
        {
          name: "2 · Link account",
          value:
            "While logged in on portfuel.pro → **#verification** → **Link PortFuel**",
          inline: false,
        },
        {
          name: "3 · You're in",
          value:
            "Member + Pro roles apply within ~60 seconds. Browse **#member-calls**, **#fueled-calls**, and **#member-chat**.",
          inline: false,
        },
        {
          name: "Help AI",
          value:
            "DM this bot — preview Q&A for anyone; **40 questions/month** for linked **Pro** members.",
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Onboarding" },
    },
    {
      title: "Membership",
      description: "Compare tiers on the site before checkout.",
      color: DISCORD_COLORS.pro,
      fields: [
        {
          name: `${memberPlan.name} · ${memberPlan.price}${memberPlan.period}`,
          value: memberPlan.tagline,
          inline: false,
        },
        {
          name: `${proPlan.name} · ${proPlan.price}${proPlan.period}`,
          value: proPlan.tagline,
          inline: false,
        },
        {
          name: "Plans & billing",
          value: `[Compare plans](${join}) · Manage in **Settings → Plan & billing**`,
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Membership" },
    },
    {
      title: "Channel guide",
      description: "Where to look for updates vs. discussion.",
      color: DISCORD_COLORS.digest,
      fields: [
        { name: "Announcements", value: "**#announcements** · Weekly movers", inline: true },
        { name: "Community", value: "**#general-chat** · Open chat", inline: true },
        { name: "Rules", value: "**#rules** · Read first", inline: true },
        { name: "Member calls", value: "**#member-calls** · New theses", inline: true },
        { name: "Fueled desk", value: "**#fueled-calls** · House calls", inline: true },
        { name: "Targets", value: "**#targets-hit** · Target reached", inline: true },
        { name: "Member lounge", value: "**#member-chat** · Linked members", inline: true },
        { name: "Pro lounge", value: "**#pro-member-chat** · Pro members", inline: true },
        { name: "Pro forums", value: "**pro-member-forums** · Deep dives", inline: true },
      ],
      footer: { text: "PortFuel · Server map" },
    },
    {
      title: "Help & support",
      description:
        "Account, billing, and technical issues are handled in the **workspace** — not in this channel.",
      color: DISCORD_COLORS.milestone,
      fields: [
        { name: "Help center", value: `[Docs & FAQs](${help})`, inline: true },
        { name: "Support ticket", value: `[Open a ticket](${help})`, inline: true },
        { name: "Email", value: "support@portfuel.pro", inline: true },
        {
          name: "Discord FAQs",
          value: "Pinned answers in **#faqs**",
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Support" },
    },
  ];
}
