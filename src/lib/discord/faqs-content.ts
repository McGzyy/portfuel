import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import {
  appIconUrl,
  hubFaq,
  hubTierLine,
} from "@/lib/discord/hub-embed-helpers";
import { PLAN_BY_TIER } from "@/lib/marketing/plans";

export const FAQS_MARKER_TITLE = "PortFuel — Quick answers";

export const FAQS_LEGACY_MARKER_TITLES = ["PortFuel — FAQs"];

export const FAQS_MESSAGE_CONTENT =
  "📌 **Quick answers** — common Discord & workspace questions. _Full docs in Help center · auto-updated by PortFuel._";

export function buildFaqsEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");
  const join = `${base}/join`;
  const help = `${base}/dashboard/help`;
  const memberPlan = PLAN_BY_TIER.member;
  const proPlan = PLAN_BY_TIER.pro;

  return [
    {
      author: { name: "PortFuel Intelligence", url: base },
      title: FAQS_MARKER_TITLE,
      url: help,
      description:
        "> Top questions from members — billing, Discord, and calls.\n\n" +
        `[**Open full Help center →**](${help}) _guides · tickets · search_`,
      color: DISCORD_COLORS.brand,
      thumbnail: { url: appIconUrl(base) },
      footer: { text: "PortFuel · FAQs" },
    },
    {
      title: "◆  Discord",
      color: DISCORD_COLORS.member,
      fields: [
        hubFaq(
          "How do I unlock channels",
          "**#verification** → **Verify**. Subscribers → **Link PortFuel** while logged in on portfuel.pro."
        ),
        hubFaq(
          "When do Member / Pro roles apply",
          "~60 seconds after linking an active subscription. Re-link after upgrading tiers."
        ),
        hubFaq(
          "What can I ask the bot in DMs",
          "**Everyone:** 5 preview Qs (features & pricing). **Linked Pro:** 40/month with full workspace context."
        ),
        hubFaq(
          "Where is the server map",
          "Pinned **Member hub** channel (onboarding + channel directory)."
        ),
      ],
      footer: { text: "PortFuel · Discord" },
    },
    {
      title: "◆  Membership & calls",
      color: DISCORD_COLORS.pro,
      fields: [
        {
          name: "Plans",
          value:
            hubTierLine(memberPlan.name, memberPlan.price, memberPlan.period, memberPlan.features[2]) +
            "\n\n" +
            hubTierLine(proPlan.name, proPlan.price, proPlan.period, "Research terminal · Help AI · 6 calls/wk"),
          inline: false,
        },
        hubFaq(
          "I paid but don't have access",
          "**Settings → Plan & billing → Refresh billing status**. Wait 2–3 min, re-link Discord. Still stuck? [Open a ticket]({help}).".replace(
            "{help}",
            help
          )
        ),
        hubFaq(
          "What is a call",
          "A **timestamped thesis** — symbol, direction, entry, target, optional stop — on your public track record."
        ),
        hubFaq(
          "What happens when target is hit",
          "**Target reached** notice in the workspace. You **close** the call to lock return — not auto-exited."
        ),
        hubFaq(
          "Where do new calls appear",
          "**#member-calls** (members) · **#fueled-calls** (desk) · full detail on portfuel.pro"
        ),
      ],
      footer: { text: "PortFuel · Plans & calls" },
    },
    {
      title: "◆  Support",
      color: DISCORD_COLORS.milestone,
      fields: [
        { name: "Help center", value: `[Docs & tickets](${help})`, inline: true },
        { name: "Compare plans", value: `[portfuel.pro/join](${join})`, inline: true },
        { name: "Email", value: "`support@portfuel.pro`", inline: true },
        hubFaq(
          "Account login or 2FA issues",
          "Open a ticket from the Help center with the email on your PortFuel account."
        ),
      ],
      footer: { text: "PortFuel · Support" },
    },
  ];
}
