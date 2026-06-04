import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import { getAppUrl } from "@/lib/stripe/config";
import type { MembershipTier } from "@/lib/stripe/config";

/** Bot delivers these via outbox (channel_id = "dm"). */
export async function enqueueDiscordDm(discordUserId: string, text: string): Promise<void> {
  const cfg = getDiscordConfig();
  if (!cfg.enabled) return;

  await enqueueDiscordOutbox({
    channelId: "dm",
    eventType: "member.dm",
    payload: { discordUserId, text },
  });
}

async function linkedDiscordUserId(userId: string): Promise<string | null> {
  const cfg = getDiscordConfig();
  const db = createServiceClient();
  const { data } = await db
    .from("discord_accounts")
    .select("discord_user_id")
    .eq("user_id", userId)
    .eq("guild_id", cfg.guildId)
    .maybeSingle();
  return data?.discord_user_id ? String(data.discord_user_id) : null;
}

export async function notifyDiscordSubscriptionChange(input: {
  userId: string;
  beforeStatus: "pending" | "active" | "cancelled" | null | undefined;
  afterStatus: "active" | "cancelled";
  tier: MembershipTier;
}): Promise<void> {
  const discordUserId = await linkedDiscordUserId(input.userId);
  if (!discordUserId) return;

  const appUrl = getAppUrl();
  const settingsUrl = `${appUrl}/settings`;

  if (input.afterStatus === "cancelled" && input.beforeStatus === "active") {
    await enqueueDiscordDm(
      discordUserId,
      `Your PortFuel subscription was **cancelled**. Member/Pro Discord channels will be removed shortly.\n\n` +
        `Renew anytime: ${settingsUrl}`
    );
    return;
  }

  if (input.afterStatus === "active" && input.beforeStatus === "cancelled") {
    const tierLabel = input.tier === "pro" ? "Pro Member" : "PortFuel Member";
    await enqueueDiscordDm(
      discordUserId,
      `Welcome back — your PortFuel subscription is **active** again (${tierLabel}).\n\n` +
        `Discord roles will update within a minute. Dashboard: ${appUrl}/dashboard`
    );
  }
}
