import {
  canUseHelpAssistant,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { runGuestHelpAssistant } from "@/lib/ai/guest-help-assistant";
import { runHelpAssistant } from "@/lib/ai/help-assistant";
import { fetchHelpAssistantUsage } from "@/lib/ai/help-assistant-usage";
import { effectiveHasProIntelligence } from "@/lib/billing/effective-access";
import { createServiceClient } from "@/lib/db/supabase";
import { fetchGuestHelpUsage } from "@/lib/discord/guest-help-usage";
import { getAppUrl } from "@/lib/stripe/config";
import type { MembershipTier } from "@/lib/stripe/config";

export type DiscordHelpAssistantResult = {
  answer: string;
  disclaimer: string;
  remaining: number;
  mode: "guest" | "pro";
  limit: number;
};

export class DiscordHelpAssistantError extends Error {
  constructor(
    readonly code:
      | "inactive"
      | "limit_reached"
      | "guest_limit_reached"
      | "not_configured"
      | "invalid_input",
    message: string
  ) {
    super(message);
    this.name = "DiscordHelpAssistantError";
  }
}

type ProHelpContext = {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
};

async function resolveProHelpContext(
  guildId: string,
  discordUserId: string
): Promise<ProHelpContext | null> {
  const db = createServiceClient();
  const { data: link } = await db
    .from("discord_accounts")
    .select("user_id")
    .eq("guild_id", guildId)
    .eq("discord_user_id", discordUserId)
    .maybeSingle();

  if (!link?.user_id) return null;

  const { data: user } = await db
    .from("users")
    .select("id, role, subscription_status, membership_tier, pro_granted_until")
    .eq("id", link.user_id)
    .maybeSingle();

  if (!user) return null;

  const role = user.role as "member" | "admin";
  const subscriptionStatus = user.subscription_status as
    | "pending"
    | "active"
    | "cancelled";
  const membershipTier = user.membership_tier as MembershipTier | null;
  const proGrantedUntil = (user as { pro_granted_until?: string | null })
    .pro_granted_until;

  if (role !== "admin" && subscriptionStatus !== "active") return null;

  if (
    !canUseHelpAssistant(membershipTier, role) ||
    !effectiveHasProIntelligence({
      role,
      subscriptionStatus,
      membershipTier,
      proGrantedUntil,
    })
  ) {
    return null;
  }

  return { userId: user.id, membershipTier, role };
}

async function runProDiscordHelp(opts: {
  ctx: ProHelpContext;
  question: string;
}): Promise<DiscordHelpAssistantResult> {
  if (!isAiCoachConfigured()) {
    throw new DiscordHelpAssistantError(
      "not_configured",
      "Help assistant is not configured right now. Browse portfuel.pro/dashboard/help or open a support ticket."
    );
  }

  const usage = await fetchHelpAssistantUsage({
    userId: opts.ctx.userId,
    membershipTier: opts.ctx.membershipTier,
    role: opts.ctx.role,
    configured: true,
  });

  if (usage.remaining <= 0) {
    throw new DiscordHelpAssistantError(
      "limit_reached",
      `You've used all ${usage.limit} help questions for this month. Resets next UTC month — or ask on portfuel.pro/dashboard/help.`
    );
  }

  const result = await runHelpAssistant({
    userId: opts.ctx.userId,
    question: opts.question,
    remainingBefore: usage.remaining,
  });

  return {
    ...result,
    mode: "pro",
    limit: usage.limit,
  };
}

async function runGuestDiscordHelp(opts: {
  discordUserId: string;
  question: string;
}): Promise<DiscordHelpAssistantResult> {
  const joinUrl = `${getAppUrl()}/join`;
  const usage = await fetchGuestHelpUsage(opts.discordUserId);

  if (usage.remaining <= 0) {
    throw new DiscordHelpAssistantError(
      "guest_limit_reached",
      `You've used all ${usage.limit} preview questions. Join PortFuel at ${joinUrl} — **Pro Intelligence** members get full Help in DMs (40/month) after linking Discord in the server.`
    );
  }

  const result = await runGuestHelpAssistant({
    discordUserId: opts.discordUserId,
    question: opts.question,
    remainingBefore: usage.remaining,
  });

  return {
    ...result,
    mode: "guest",
    limit: usage.limit,
  };
}

export async function runDiscordHelpAssistant(opts: {
  guildId: string;
  discordUserId: string;
  question: string;
}): Promise<DiscordHelpAssistantResult> {
  const question = opts.question.trim();
  if (question.length < 4) {
    throw new DiscordHelpAssistantError(
      "invalid_input",
      "Ask a PortFuel question with at least a few words."
    );
  }
  if (question.length > 1000) {
    throw new DiscordHelpAssistantError(
      "invalid_input",
      "Keep your question under 1,000 characters."
    );
  }

  const proCtx = await resolveProHelpContext(opts.guildId, opts.discordUserId);
  if (proCtx) {
    return runProDiscordHelp({ ctx: proCtx, question });
  }

  return runGuestDiscordHelp({
    discordUserId: opts.discordUserId,
    question,
  });
}
