import {
  canUseHelpAssistant,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { runHelpAssistant } from "@/lib/ai/help-assistant";
import { fetchHelpAssistantUsage } from "@/lib/ai/help-assistant-usage";
import { effectiveHasProIntelligence } from "@/lib/billing/effective-access";
import { createServiceClient } from "@/lib/db/supabase";
import type { MembershipTier } from "@/lib/stripe/config";

export type DiscordHelpAssistantResult = {
  answer: string;
  disclaimer: string;
  remaining: number;
};

export class DiscordHelpAssistantError extends Error {
  constructor(
    readonly code:
      | "not_linked"
      | "inactive"
      | "pro_required"
      | "limit_reached"
      | "not_configured"
      | "invalid_input",
    message: string
  ) {
    super(message);
    this.name = "DiscordHelpAssistantError";
  }
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

  const db = createServiceClient();
  const { data: link } = await db
    .from("discord_accounts")
    .select("user_id")
    .eq("guild_id", opts.guildId)
    .eq("discord_user_id", opts.discordUserId)
    .maybeSingle();

  if (!link?.user_id) {
    throw new DiscordHelpAssistantError(
      "not_linked",
      "Link your PortFuel account first — go to #verification and click **Link PortFuel** while logged in on portfuel.pro."
    );
  }

  const { data: user } = await db
    .from("users")
    .select("id, role, subscription_status, membership_tier, pro_granted_until")
    .eq("id", link.user_id)
    .maybeSingle();

  if (!user) {
    throw new DiscordHelpAssistantError(
      "not_linked",
      "Could not find your PortFuel account. Try linking again from #verification."
    );
  }

  const role = user.role as "member" | "admin";
  const subscriptionStatus = user.subscription_status as
    | "pending"
    | "active"
    | "cancelled";
  const membershipTier = user.membership_tier as MembershipTier | null;
  const proGrantedUntil = (user as { pro_granted_until?: string | null })
    .pro_granted_until;

  if (role !== "admin" && subscriptionStatus !== "active") {
    throw new DiscordHelpAssistantError(
      "inactive",
      "Your PortFuel membership is not active. Finish checkout or renew billing on portfuel.pro, then try again."
    );
  }

  if (
    !canUseHelpAssistant(membershipTier, role) ||
    !effectiveHasProIntelligence({
      role,
      subscriptionStatus,
      membershipTier,
      proGrantedUntil,
    })
  ) {
    throw new DiscordHelpAssistantError(
      "pro_required",
      "The PortFuel Help assistant is a **Pro Intelligence** perk. Upgrade on portfuel.pro → Settings → Billing, or use the docs at portfuel.pro/dashboard/help."
    );
  }

  if (!isAiCoachConfigured()) {
    throw new DiscordHelpAssistantError(
      "not_configured",
      "Help assistant is not configured right now. Browse portfuel.pro/dashboard/help or open a support ticket."
    );
  }

  const usage = await fetchHelpAssistantUsage({
    userId: user.id,
    membershipTier,
    role,
    configured: true,
  });

  if (usage.remaining <= 0) {
    throw new DiscordHelpAssistantError(
      "limit_reached",
      `You've used all ${usage.limit} help questions for this month. Resets next UTC month — or ask on portfuel.pro/dashboard/help.`
    );
  }

  return runHelpAssistant({
    userId: user.id,
    question,
    remainingBefore: usage.remaining,
  });
}
