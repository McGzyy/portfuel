import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";

/** First embed title — bot uses this to find and refresh the pinned rules message. */
export const RULES_MARKER_TITLE = "PortFuel — Server rules";

export function buildRulesMessageContent(appUrl: string): string {
  const terms = `${appUrl.replace(/\/$/, "")}/terms`;
  return (
    "**Community standards** — participating here means you agree to these rules and our " +
    `[Terms of Service](${terms}). ` +
    "_Updated automatically by the PortFuel bot._"
  );
}

export function buildRulesEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const base = appUrl.replace(/\/$/, "");
  const terms = `${base}/terms`;
  const privacy = `${base}/privacy`;

  return [
    {
      author: { name: "PortFuel", url: base },
      title: RULES_MARKER_TITLE,
      url: terms,
      description:
        "PortFuel Discord is an extension of the **member workspace** — professional discussion, educational theses, and community support.\n\n" +
        "_Nothing here is investment advice. Trading involves substantial risk of loss._",
      color: DISCORD_COLORS.brand,
      footer: { text: "PortFuel · Server rules" },
    },
    {
      title: "Respect & integrity",
      description: "Keep the server constructive and safe for serious members.",
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "Be professional",
          value:
            "No harassment, hate speech, slurs, or personal attacks. Debate ideas — not people.",
          inline: false,
        },
        {
          name: "No spam or scams",
          value:
            "No unsolicited DMs, referral spam, fake giveaways, phishing, or impersonation of staff or members.",
          inline: false,
        },
        {
          name: "One account",
          value:
            "One PortFuel account per person. No ban evasion or duplicate accounts to game quotas or rankings.",
          inline: false,
        },
        {
          name: "Privacy",
          value:
            `Do not share others' private info. See our [Privacy Policy](${privacy}).`,
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Conduct" },
    },
    {
      title: "Trading & content",
      description: "Educational theses only — the same standard as the PortFuel workspace.",
      color: DISCORD_COLORS.pro,
      fields: [
        {
          name: "Not investment advice",
          value:
            "Member and desk calls are opinions for education. PortFuel does not execute trades or recommend positions.",
          inline: false,
        },
        {
          name: "No pump & dump",
          value:
            "No coordinated promotion, \"guaranteed\" returns, front-running members, or pressure to buy/sell.",
          inline: false,
        },
        {
          name: "Publish on PortFuel",
          value:
            "Timestamped calls belong in the **workspace** — they surface in **#member-calls** and **#fueled-calls** via bot posts.",
          inline: false,
        },
        {
          name: "AI & help",
          value:
            "DM the bot for product Q&A only. Do not treat bot replies as trade recommendations.",
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Content" },
    },
    {
      title: "Channels & moderation",
      description: "Use the right room — staff may remove content or restrict access for violations.",
      color: DISCORD_COLORS.digest,
      fields: [
        {
          name: "Read-only feeds",
          value:
            "**#member-calls**, **#fueled-calls**, **#targets-hit**, **#announcements** — bot posts only. Discuss in lounges.",
          inline: false,
        },
        {
          name: "Discussion",
          value:
            "**#general-chat** (open) · **#member-chat** (linked members) · **#pro-member-chat** (Pro)",
          inline: false,
        },
        {
          name: "Deep dives",
          value:
            "**pro-member-forums** — one ticker per thread; include direction, timeframe, and invalidation.",
          inline: false,
        },
        {
          name: "Enforcement",
          value:
            `Warnings, mutes, or bans for repeat or severe violations. Appeal via [support](${base}/dashboard/help) or support@portfuel.pro.`,
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Channels" },
    },
  ];
}
