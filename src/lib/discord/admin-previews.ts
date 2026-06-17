import { buildSupportTicketEmbed } from "@/lib/discord/admin-events";
import {
  discordLineFromCopy,
  discordMilestoneLineFromCopy,
} from "@/lib/discord/discord-copy";
import {
  buildFueledCallEmbed,
  buildLinkWelcomeEmbed,
  buildMemberNewCallEmbed,
  buildMemberSpotlightEmbed,
  buildMilestoneChatEmbed,
  buildTargetHitChannelEmbed,
  buildWeeklyDigestEmbed,
  DISCORD_COLORS,
  type DiscordEmbedPayload,
} from "@/lib/discord/embed-payloads";
import { buildFaqsEmbeds, FAQS_MESSAGE_CONTENT, FAQS_MARKER_TITLE } from "@/lib/discord/faqs-content";
import {
  buildOfficialLinksEmbeds,
  OFFICIAL_LINKS_MESSAGE_CONTENT,
  OFFICIAL_LINKS_MARKER_TITLE,
} from "@/lib/discord/official-links-content";
import { buildForumsEmbeds, FORUMS_MARKER_TITLE, FORUMS_MESSAGE_CONTENT } from "@/lib/discord/forums-content";
import { buildRulesEmbeds, buildRulesMessageContent, RULES_MARKER_TITLE } from "@/lib/discord/rules-content";
import {
  buildMemberSupportHubEmbeds,
  MEMBER_SUPPORT_HUB_CONTENT,
  MEMBER_SUPPORT_HUB_MARKER,
} from "@/lib/discord/support-tickets";
import {
  buildOpenTicketHubEmbeds,
  OPEN_TICKET_HUB_CONTENT,
  OPEN_TICKET_HUB_MARKER,
} from "@/lib/discord/open-ticket-content";
import { buildVerificationEmbed, VERIFICATION_MARKER_TITLE } from "@/lib/discord/verification-content";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import type { SupportTicketWithUser } from "@/lib/support/types";
import {
  DEFAULT_SOCIAL_POST_COPY,
  type SocialPostCopy,
} from "@/lib/social/copy-templates";

export type DiscordPreviewChartMilestone = CallMilestoneKey;

export type DiscordPreviewItem = {
  id: string;
  label: string;
  channel: string;
  eventType: string;
  group: "calls" | "hubs" | "community" | "staff";
  content?: string;
  embeds: DiscordEmbedPayload[];
  attachChart?: boolean;
  chartMilestone?: DiscordPreviewChartMilestone;
  chartMemberWin?: boolean;
  chartWeeklyDigest?: boolean;
  note?: string;
};

const DEMO_CALL = {
  symbol: "NVDA",
  direction: "long" as const,
  username: "deskalpha",
  displayName: "Desk Alpha",
  thesis:
    "AI capex cycle intact. Pullback into prior breakout zone with volume drying up. Target prior high; stop below last swing low.",
  entryPrice: 118.42,
  targetPrice: 142.0,
  stopPrice: 109.5,
  returnPct: 18.6,
};

function demoSupportTicket(): SupportTicketWithUser {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-4000-8000-000000000001",
    ticket_number: 42,
    user_id: "00000000-0000-4000-8000-000000000002",
    category: "billing",
    subject: "Pro upgrade not reflected in Discord",
    status: "waiting_on_support",
    priority: "normal",
    created_at: now,
    updated_at: now,
    last_message_at: now,
    resolved_at: null,
    username: DEMO_CALL.username,
    display_name: DEMO_CALL.displayName,
    email: "member@example.com",
  };
}

function staffEmbed(
  input: DiscordEmbedPayload & { channel: string; eventType: string; id: string; label: string }
): DiscordPreviewItem {
  const { channel, eventType, id, label, ...embed } = input;
  return {
    id,
    label,
    channel,
    eventType,
    group: "staff",
    embeds: [embed],
  };
}

export function buildAdminDiscordPreviews(
  appUrl: string,
  copy: SocialPostCopy = DEFAULT_SOCIAL_POST_COPY
): {
  sections: { id: string; title: string; description: string; items: DiscordPreviewItem[] }[];
} {
  const base = appUrl.replace(/\/$/, "");
  const tickerUrl = `${base}/ticker/${DEMO_CALL.symbol}`;

  const callItems: DiscordPreviewItem[] = [
    {
      id: "member_new_call",
      label: "New member call",
      channel: "#member-calls",
      eventType: "call.created",
      group: "calls",
      content: discordLineFromCopy(copy, "memberNew"),
      embeds: [
        buildMemberNewCallEmbed({
          ...DEMO_CALL,
          url: tickerUrl,
          appUrl: base,
        }),
      ],
    },
    {
      id: "fueled_new_call",
      label: "Fueled desk call",
      channel: "#fueled-calls",
      eventType: "call.created.fueled",
      group: "calls",
      content: discordLineFromCopy(copy, "fueled"),
      embeds: [
        buildFueledCallEmbed({
          symbol: DEMO_CALL.symbol,
          direction: DEMO_CALL.direction,
          url: tickerUrl,
          appUrl: base,
          displayName: "PortFuel Desk",
          thesis: DEMO_CALL.thesis,
          entryPrice: DEMO_CALL.entryPrice,
          targetPrice: DEMO_CALL.targetPrice,
          stopPrice: DEMO_CALL.stopPrice,
          returnPct: 4.2,
        }),
      ],
      attachChart: true,
    },
    {
      id: "target_hit_channel",
      label: "Target reached (channel)",
      channel: "#targets-hit",
      eventType: "call.target_hit",
      group: "calls",
      content: discordLineFromCopy(copy, "targetHit", { symbol: DEMO_CALL.symbol }),
      attachChart: true,
      chartMilestone: "target_reached",
      embeds: [
        buildTargetHitChannelEmbed({
          symbol: DEMO_CALL.symbol,
          direction: DEMO_CALL.direction,
          url: tickerUrl,
          username: DEMO_CALL.username,
          displayName: DEMO_CALL.displayName,
          returnPct: 20.1,
          entryPrice: DEMO_CALL.entryPrice,
          targetPrice: DEMO_CALL.targetPrice,
          appUrl: base,
          isFueled: false,
        }),
      ],
    },
    {
      id: "milestone_25_chat",
      label: "+25% milestone (member chat)",
      channel: "#member-chat",
      eventType: "call.milestone.snippet",
      group: "calls",
      content: discordMilestoneLineFromCopy(copy, "return_25", DEMO_CALL.symbol),
      embeds: [
        buildMilestoneChatEmbed({
          symbol: DEMO_CALL.symbol,
          direction: DEMO_CALL.direction,
          url: tickerUrl,
          milestone: "return_25",
          returnPct: 25.4,
          username: DEMO_CALL.username,
          displayName: DEMO_CALL.displayName,
          appUrl: base,
          isFueled: false,
          entryPrice: DEMO_CALL.entryPrice,
          targetPrice: DEMO_CALL.targetPrice,
        }),
      ],
    },
    {
      id: "fueled_milestone_25_chat",
      label: "+25% milestone (fueled · chart)",
      channel: "#member-chat",
      eventType: "call.milestone.snippet",
      group: "calls",
      content: discordMilestoneLineFromCopy(copy, "return_25", DEMO_CALL.symbol),
      attachChart: true,
      chartMilestone: "return_25",
      embeds: [
        buildMilestoneChatEmbed({
          symbol: DEMO_CALL.symbol,
          direction: DEMO_CALL.direction,
          url: tickerUrl,
          milestone: "return_25",
          returnPct: 27.8,
          username: "PortFuel Desk",
          displayName: "PortFuel Desk",
          appUrl: base,
          isFueled: true,
          entryPrice: DEMO_CALL.entryPrice,
          targetPrice: DEMO_CALL.targetPrice,
        }),
      ],
    },
    {
      id: "fueled_milestone_50_chat",
      label: "+50% milestone (fueled · chart)",
      channel: "#member-chat",
      eventType: "call.milestone.snippet",
      group: "calls",
      content: discordMilestoneLineFromCopy(copy, "return_50", DEMO_CALL.symbol),
      attachChart: true,
      chartMilestone: "return_50",
      embeds: [
        buildMilestoneChatEmbed({
          symbol: DEMO_CALL.symbol,
          direction: DEMO_CALL.direction,
          url: tickerUrl,
          milestone: "return_50",
          returnPct: 52.4,
          username: "PortFuel Desk",
          displayName: "PortFuel Desk",
          appUrl: base,
          isFueled: true,
          entryPrice: DEMO_CALL.entryPrice,
          targetPrice: DEMO_CALL.targetPrice,
        }),
      ],
    },
    {
      id: "member_spotlight",
      label: "Member spotlight (chart)",
      channel: "#member-calls",
      eventType: "member.spotlight",
      group: "calls",
      content: discordLineFromCopy(copy, "memberSpotlight", { symbol: DEMO_CALL.symbol }),
      attachChart: true,
      chartMemberWin: true,
      note: "Uses memberWin chart variant",
      embeds: [
        buildMemberSpotlightEmbed({
          ...DEMO_CALL,
          url: tickerUrl,
          appUrl: base,
          returnPct: 31.2,
        }),
      ],
    },
  ];

  const hubItems: DiscordPreviewItem[] = [
    {
      id: "hub_official_links",
      label: OFFICIAL_LINKS_MARKER_TITLE,
      channel: "#official-links",
      eventType: "hub.official_links",
      group: "hubs",
      content: OFFICIAL_LINKS_MESSAGE_CONTENT,
      embeds: buildOfficialLinksEmbeds(base),
    },
    {
      id: "hub_rules",
      label: RULES_MARKER_TITLE,
      channel: "#rules",
      eventType: "hub.rules",
      group: "hubs",
      content: buildRulesMessageContent(base),
      embeds: buildRulesEmbeds(base),
    },
    {
      id: "hub_faqs",
      label: FAQS_MARKER_TITLE,
      channel: "#faqs",
      eventType: "hub.faqs",
      group: "hubs",
      content: FAQS_MESSAGE_CONTENT,
      embeds: buildFaqsEmbeds(base),
    },
    {
      id: "hub_verification",
      label: VERIFICATION_MARKER_TITLE,
      channel: "#verification",
      eventType: "hub.verification",
      group: "hubs",
      embeds: [buildVerificationEmbed(base)],
      note: "Bot adds Verify + Link PortFuel buttons below this embed.",
    },
    {
      id: "hub_member_support",
      label: MEMBER_SUPPORT_HUB_MARKER,
      channel: "#member-support (Mod Lounge)",
      eventType: "hub.member_support",
      group: "hubs",
      content: MEMBER_SUPPORT_HUB_CONTENT,
      embeds: buildMemberSupportHubEmbeds(base),
    },
    {
      id: "hub_open_ticket",
      label: OPEN_TICKET_HUB_MARKER,
      channel: "#open-ticket",
      eventType: "hub.open_ticket",
      group: "hubs",
      content: OPEN_TICKET_HUB_CONTENT,
      embeds: buildOpenTicketHubEmbeds(base),
      note: "Bot adds a category select menu below this embed.",
    },
    {
      id: "hub_pro_forums",
      label: FORUMS_MARKER_TITLE,
      channel: "#pro-forums",
      eventType: "hub.forums",
      group: "hubs",
      content: FORUMS_MESSAGE_CONTENT,
      embeds: buildForumsEmbeds(base),
    },
  ];

  const communityItems: DiscordPreviewItem[] = [
    {
      id: "member_linked",
      label: "Workspace linked",
      channel: "#member-chat / #pro-member-chat",
      eventType: "member.linked",
      group: "community",
      content: "✅ **Member connected**",
      embeds: [
        buildLinkWelcomeEmbed({
          username: DEMO_CALL.username,
          displayName: DEMO_CALL.displayName,
          isPro: false,
          appUrl: base,
        }),
      ],
    },
    {
      id: "weekly_digest",
      label: "Weekly movers digest",
      channel: "#announcements",
      eventType: "digest.weekly",
      group: "community",
      content: discordLineFromCopy(copy, "weeklyDigest"),
      attachChart: true,
      chartWeeklyDigest: true,
      note: "Uses weekly digest composite chart",
      embeds: [
        buildWeeklyDigestEmbed({
          appUrl: base,
          feedUrl: `${base}/dashboard/feed`,
          rows: [
            {
              symbol: "NVDA",
              direction: "long",
              returnPct: 22.4,
              handle: "@deskalpha",
            },
            {
              symbol: "AMD",
              direction: "long",
              returnPct: 14.1,
              handle: `@${DEMO_CALL.username}`,
            },
          ],
        }),
      ],
    },
  ];

  const staffItems: DiscordPreviewItem[] = [
    {
      id: "support_ticket_new",
      label: "New support ticket (private channel)",
      channel: "#portfuel-support",
      eventType: "support.ticket.create_channel",
      group: "staff",
      embeds: [
        buildSupportTicketEmbed({
          ticket: demoSupportTicket(),
          preview: "I upgraded to Pro but Discord still shows Member only.",
          kind: "new",
        }),
      ],
    },
    staffEmbed({
      id: "billing_new",
      label: "New subscription",
      channel: "#billing",
      eventType: "billing.subscription.new",
      title: "New subscription",
      url: `${base}/admin?tab=members`,
      description: `**${DEMO_CALL.displayName}** (@${DEMO_CALL.username}) activated **Pro Intelligence**.`,
      color: DISCORD_COLORS.long,
      fields: [
        { name: "Plan", value: "Pro Intelligence · Monthly", inline: true },
        { name: "Price", value: "$49/mo", inline: true },
        { name: "Stripe sub", value: "`sub_preview_abc123…`", inline: true },
      ],
      footer: { text: "PortFuel · Billing" },
    }),
    staffEmbed({
      id: "billing_renewal",
      label: "Renewal paid",
      channel: "#billing",
      eventType: "billing.invoice.paid",
      title: "Renewal paid",
      description: `**${DEMO_CALL.displayName}** (@${DEMO_CALL.username}) · **Member**`,
      color: DISCORD_COLORS.milestone,
      fields: [
        { name: "Amount", value: "$29.00", inline: true },
        { name: "Plan", value: "Member", inline: true },
        { name: "Invoice", value: "`in_preview_abc123…`", inline: true },
      ],
      footer: { text: "PortFuel · Recurring revenue" },
    }),
    staffEmbed({
      id: "billing_failed",
      label: "Payment failed",
      channel: "#billing",
      eventType: "billing.invoice.failed",
      title: "Payment failed",
      description: `**${DEMO_CALL.displayName}** (@${DEMO_CALL.username}) — follow up in Stripe.`,
      color: DISCORD_COLORS.brand,
      fields: [
        { name: "Amount", value: "$29.00", inline: true },
        { name: "Plan", value: "Member", inline: true },
        { name: "Invoice", value: "`in_failed_preview…`", inline: true },
      ],
      footer: { text: "PortFuel · Billing alert" },
    }),
    staffEmbed({
      id: "churn_feedback",
      label: "Cancellation feedback",
      channel: "#churn",
      eventType: "churn.feedback",
      title: "Cancellation feedback",
      url: `${base}/admin?tab=churn`,
      description: "Pausing trading for a few months — may return after summer.",
      color: DISCORD_COLORS.digest,
      fields: [
        { name: "Member", value: `**${DEMO_CALL.displayName}** (@${DEMO_CALL.username})`, inline: true },
        { name: "Reason", value: "Taking a break", inline: true },
        { name: "Tier", value: "Member", inline: true },
        { name: "Admin", value: `[Open churn panel →](${base}/admin?tab=churn)`, inline: false },
      ],
      footer: { text: "PortFuel · Exit survey" },
    }),
    staffEmbed({
      id: "growth_signup",
      label: "New registration",
      channel: "#growth",
      eventType: "growth.signup",
      title: "New account",
      url: `${base}/join`,
      description: `**${DEMO_CALL.displayName}** registered as **@${DEMO_CALL.username}**.`,
      color: DISCORD_COLORS.member,
      fields: [{ name: "Referral", value: "Direct signup", inline: false }],
      footer: { text: "PortFuel · Growth" },
    }),
    staffEmbed({
      id: "referral_converted",
      label: "Referral converted",
      channel: "#referrals",
      eventType: "referral.converted",
      title: "Referral converted",
      description: "**New Member** subscribed — referred by **Desk Alpha**.",
      color: DISCORD_COLORS.pro,
      fields: [
        { name: "Referrer", value: `@${DEMO_CALL.username}`, inline: true },
        { name: "New member", value: "@newmember", inline: true },
        { name: "Code", value: "`DESKALPHA`", inline: true },
      ],
      footer: { text: "PortFuel · Referrals" },
    }),
  ];

  return {
    sections: [
      {
        id: "calls",
        title: "Call alerts",
        description: "Posted when members publish calls or price milestones hit.",
        items: callItems,
      },
      {
        id: "hubs",
        title: "Pinned hubs",
        description: "Auto-refreshed when the droplet bot starts or redeploys.",
        items: hubItems,
      },
      {
        id: "community",
        title: "Community",
        description: "Member connection welcomes and scheduled digest posts.",
        items: communityItems,
      },
      {
        id: "staff",
        title: "Staff channels",
        description: "Internal alerts for billing, growth, churn, referrals, and support.",
        items: staffItems,
      },
    ],
  };
}
