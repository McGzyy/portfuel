import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import { PLAN_BY_TIER } from "@/lib/marketing/plans";

/** First embed title — bot uses this to find and refresh the pinned FAQ message. */
export const FAQS_MARKER_TITLE = "PortFuel — FAQs";

export const FAQS_MESSAGE_CONTENT =
  "**Quick answers** — for full docs and support tickets, use the workspace Help center. _Updated automatically by the PortFuel bot._";

export function buildFaqsEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");
  const join = `${base}/join`;
  const help = `${base}/dashboard/help`;
  const memberPlan = PLAN_BY_TIER.member;
  const proPlan = PLAN_BY_TIER.pro;

  return [
    {
      author: { name: "PortFuel", url: base },
      title: FAQS_MARKER_TITLE,
      url: help,
      description:
        "Answers to the most common Discord and workspace questions. " +
        `[Open full Help center](${help}) for guides, billing, and tickets.`,
      color: DISCORD_COLORS.brand,
      footer: { text: "PortFuel · FAQs" },
    },
    {
      title: "Discord setup",
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "How do I unlock channels?",
          value:
            "**#verification** → **Verify** for basic channels. Subscribers → **Link PortFuel** while logged in on portfuel.pro.",
          inline: false,
        },
        {
          name: "When do Member / Pro roles apply?",
          value:
            "Within ~60 seconds after linking an active subscription. Re-link if you upgrade tiers.",
          inline: false,
        },
        {
          name: "What can I ask the bot in DMs?",
          value:
            "**Everyone:** 5 preview questions (features & pricing). **Linked Pro:** 40/month with full workspace answers.",
          inline: false,
        },
        {
          name: "Where is the channel map?",
          value: "Pinned hub in **#official-links**.",
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Discord" },
    },
    {
      title: "Membership & billing",
      color: DISCORD_COLORS.pro,
      fields: [
        {
          name: `${memberPlan.name} vs ${proPlan.name}`,
          value:
            `**${memberPlan.name}** (${memberPlan.price}${memberPlan.period}) — ${memberPlan.features[2]}. ` +
            `**${proPlan.name}** (${proPlan.price}${proPlan.period}) — research terminal, Help AI, SMS alerts, ${proPlan.features[1]}.`,
          inline: false,
        },
        {
          name: "I paid but don't have access",
          value:
            `Dashboard → **Settings → Plan & billing** → **Refresh billing status**. Wait 2–3 minutes, then re-link Discord if needed. Still stuck? [Open a ticket](${help}).`,
          inline: false,
        },
        {
          name: "Compare plans",
          value: `[portfuel.pro/join](${join})`,
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Billing" },
    },
    {
      title: "Calls & track record",
      color: DISCORD_COLORS.long,
      fields: [
        {
          name: "What is a call?",
          value:
            "A timestamped thesis: symbol, direction, entry, target, optional stop. Published on your public track record.",
          inline: false,
        },
        {
          name: "What happens when target is hit?",
          value:
            "You get a **Target reached** notice in the workspace. Return stays live until **you close** the call — same as a professional journal.",
          inline: false,
        },
        {
          name: "Where do new calls appear?",
          value:
            "**#member-calls** (members) · **#fueled-calls** (desk) · full detail on portfuel.pro",
          inline: false,
        },
        {
          name: "Weekly quota",
          value: `**${memberPlan.name}:** 2 calls/week · **${proPlan.name}:** 6 calls/week`,
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Calls" },
    },
    {
      title: "Support",
      color: DISCORD_COLORS.milestone,
      fields: [
        {
          name: "Help center",
          value: `[Docs, guides & tickets](${help})`,
          inline: true,
        },
        {
          name: "Email",
          value: "support@portfuel.pro",
          inline: true,
        },
        {
          name: "Server rules",
          value: "See **#rules**",
          inline: true,
        },
        {
          name: "Account issues",
          value:
            "Login, 2FA, username changes, and moderation status — use a support ticket with your account email.",
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Support" },
    },
  ];
}
