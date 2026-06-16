import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import { getDiscordConfig } from "@/lib/discord/config";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import { adminChurnPanelUrl } from "@/lib/billing/cancellation-feedback";
import { cancellationReasonLabel } from "@/lib/billing/cancellation-feedback-types";
import type { CancellationFeedbackWithUser } from "@/lib/billing/cancellation-feedback-types";
import { formatTierPrice } from "@/lib/marketing/plans";
import { adminSupportPanelUrl } from "@/lib/support/tickets";
import type { SupportCategory, SupportTicketWithUser } from "@/lib/support/types";
import {
  formatTicketRef,
  supportCategoryLabel,
  supportStatusLabel,
} from "@/lib/support/types";
import { getAppUrl, type BillingInterval, type MembershipTier } from "@/lib/stripe/config";

function previewText(text: string, max = 280): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatMoney(cents: number | null | undefined, currency = "usd"): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function tierLabel(tier: MembershipTier): string {
  return tier === "pro" ? "Pro Intelligence" : "Member";
}

function intervalLabel(interval: BillingInterval | null | undefined): string {
  return interval === "annual" ? "Annual" : "Monthly";
}

async function postAdminEmbed(
  channelId: string | undefined,
  eventType: string,
  embed: DiscordEmbedPayload,
  dedupeKey?: string
): Promise<void> {
  if (!channelId) return;
  await enqueueDiscordOutbox({
    channelId,
    eventType,
    dedupeKey,
    payload: { embed },
  });
}

function categoryColor(category: SupportCategory): number {
  switch (category) {
    case "billing":
      return DISCORD_COLORS.pro;
    case "account":
      return DISCORD_COLORS.milestone;
    case "calls":
      return DISCORD_COLORS.long;
    case "technical":
      return DISCORD_COLORS.member;
    default:
      return DISCORD_COLORS.digest;
  }
}

export function buildSupportTicketEmbed(input: {
  ticket: SupportTicketWithUser;
  preview: string;
  kind: "new" | "member_reply";
}): DiscordEmbedPayload {
  const ref = formatTicketRef(input.ticket.ticket_number);
  const member = input.ticket.display_name?.trim() || input.ticket.username;
  const adminUrl = adminSupportPanelUrl(input.ticket.id);
  const isReply = input.kind === "member_reply";

  return {
    title: isReply ? `${ref} · Member reply` : `${ref} · New ticket`,
    url: adminUrl,
    description: previewText(input.preview),
    color: categoryColor(input.ticket.category),
    fields: [
      { name: "Subject", value: input.ticket.subject.slice(0, 256), inline: false },
      { name: "Category", value: supportCategoryLabel(input.ticket.category), inline: true },
      { name: "Status", value: supportStatusLabel(input.ticket.status), inline: true },
      { name: "Member", value: `**${member}** (@${input.ticket.username})`, inline: true },
      { name: "Admin", value: `[Open ticket →](${adminUrl})`, inline: false },
    ],
    footer: { text: isReply ? "PortFuel · Support queue" : "PortFuel · New support ticket" },
  };
}

export async function notifyDiscordAdminSupportTicket(input: {
  ticket: SupportTicketWithUser;
  preview: string;
  kind: "new" | "member_reply";
}): Promise<void> {
  const { channels } = getDiscordConfig();
  await postAdminEmbed(
    channels.memberSupport,
    input.kind === "new" ? "support.ticket.created" : "support.ticket.member_reply",
    buildSupportTicketEmbed(input),
    input.kind === "new" ? `support:${input.ticket.id}:created` : undefined
  );
}

export async function notifyDiscordBillingNewSubscription(input: {
  userId: string;
  username: string;
  displayName: string | null;
  tier: MembershipTier;
  billingInterval: BillingInterval;
  stripeSubscriptionId: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const adminUrl = `${getAppUrl()}/admin?tab=members`;
  const who = input.displayName?.trim() || input.username;

  await postAdminEmbed(
    channels.billing,
    "billing.subscription.new",
    {
      title: "New subscription",
      url: adminUrl,
      description: `**${who}** (@${input.username}) activated **${tierLabel(input.tier)}**.`,
      color: DISCORD_COLORS.long,
      fields: [
        { name: "Plan", value: `${tierLabel(input.tier)} · ${intervalLabel(input.billingInterval)}`, inline: true },
        { name: "Price", value: formatTierPrice(input.tier), inline: true },
        { name: "Stripe sub", value: `\`${input.stripeSubscriptionId.slice(0, 28)}…\``, inline: true },
      ],
      footer: { text: "PortFuel · Billing" },
    },
    `billing:new:${input.stripeSubscriptionId}`
  );
}

export async function notifyDiscordBillingRenewal(input: {
  username: string;
  displayName: string | null;
  tier: MembershipTier;
  amountCents: number;
  currency: string;
  invoiceId: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const who = input.displayName?.trim() || input.username;

  await postAdminEmbed(
    channels.billing,
    "billing.invoice.paid",
    {
      title: "Renewal paid",
      description: `**${who}** (@${input.username}) · **${tierLabel(input.tier)}**`,
      color: DISCORD_COLORS.milestone,
      fields: [
        { name: "Amount", value: formatMoney(input.amountCents, input.currency), inline: true },
        { name: "Plan", value: tierLabel(input.tier), inline: true },
        { name: "Invoice", value: `\`${input.invoiceId.slice(0, 24)}…\``, inline: true },
      ],
      footer: { text: "PortFuel · Recurring revenue" },
    },
    `billing:renewal:${input.invoiceId}`
  );
}

export async function notifyDiscordBillingPaymentFailed(input: {
  username: string;
  displayName: string | null;
  tier: MembershipTier | null;
  amountCents: number;
  currency: string;
  invoiceId: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const who = input.displayName?.trim() || input.username;

  await postAdminEmbed(
    channels.billing,
    "billing.invoice.failed",
    {
      title: "Payment failed",
      description: `**${who}** (@${input.username}) — follow up in Stripe.`,
      color: DISCORD_COLORS.brand,
      fields: [
        { name: "Amount", value: formatMoney(input.amountCents, input.currency), inline: true },
        { name: "Plan", value: input.tier ? tierLabel(input.tier) : "—", inline: true },
        { name: "Invoice", value: `\`${input.invoiceId.slice(0, 24)}…\``, inline: true },
      ],
      footer: { text: "PortFuel · Billing alert" },
    },
    `billing:failed:${input.invoiceId}`
  );
}

export async function notifyDiscordBillingCancelled(input: {
  username: string;
  displayName: string | null;
  tier: MembershipTier;
  stripeSubscriptionId: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const who = input.displayName?.trim() || input.username;

  await postAdminEmbed(
    channels.billing,
    "billing.subscription.cancelled",
    {
      title: "Subscription ended",
      description: `**${who}** (@${input.username}) · **${tierLabel(input.tier)}**`,
      color: DISCORD_COLORS.short,
      footer: { text: "PortFuel · Churn signal" },
    },
    `billing:cancelled:${input.stripeSubscriptionId}`
  );
}

export async function notifyDiscordChurnFeedback(feedback: CancellationFeedbackWithUser): Promise<void> {
  const { channels } = getDiscordConfig();
  const member = feedback.display_name?.trim() || feedback.username;
  const reason = cancellationReasonLabel(feedback.reason);
  const adminUrl = adminChurnPanelUrl();

  await postAdminEmbed(
    channels.churn,
    "churn.feedback",
    {
      title: "Cancellation feedback",
      url: adminUrl,
      description: previewText(feedback.comment || reason),
      color: DISCORD_COLORS.digest,
      fields: [
        { name: "Member", value: `**${member}** (@${feedback.username})`, inline: true },
        { name: "Reason", value: reason, inline: true },
        { name: "Tier", value: feedback.membership_tier ? tierLabel(feedback.membership_tier as MembershipTier) : "—", inline: true },
        { name: "Admin", value: `[Open churn panel →](${adminUrl})`, inline: false },
      ],
      footer: { text: "PortFuel · Exit survey" },
    },
    `churn:${feedback.id}`
  );
}

export async function notifyDiscordGrowthSignup(input: {
  username: string;
  displayName: string;
  referralCode?: string | null;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const joinUrl = `${getAppUrl()}/join`;

  await postAdminEmbed(
    channels.growth,
    "growth.signup",
    {
      title: "New account",
      url: joinUrl,
      description: `**${input.displayName}** registered as **@${input.username}**.`,
      color: DISCORD_COLORS.member,
      fields: [
        {
          name: "Referral",
          value: input.referralCode ? `Referred via \`${input.referralCode}\`` : "Direct signup",
          inline: false,
        },
      ],
      footer: { text: "PortFuel · Growth" },
    },
    undefined
  );
}

export async function notifyDiscordReferralConverted(input: {
  referrerUsername: string;
  referrerDisplayName: string | null;
  referredUsername: string;
  referredDisplayName: string | null;
  referralCode: string;
}): Promise<void> {
  const { channels } = getDiscordConfig();
  const referrer = input.referrerDisplayName?.trim() || input.referrerUsername;
  const referred = input.referredDisplayName?.trim() || input.referredUsername;

  await postAdminEmbed(
    channels.referrals,
    "referral.converted",
    {
      title: "Referral converted",
      description: `**${referred}** subscribed — referred by **${referrer}**.`,
      color: DISCORD_COLORS.pro,
      fields: [
        { name: "Referrer", value: `@${input.referrerUsername}`, inline: true },
        { name: "New member", value: `@${input.referredUsername}`, inline: true },
        { name: "Code", value: `\`${input.referralCode}\``, inline: true },
      ],
      footer: { text: "PortFuel · Referrals" },
    },
    `referral:converted:${input.referredUsername}`
  );
}
