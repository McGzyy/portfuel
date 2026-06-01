import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";

/** Mark linked Discord accounts dirty so the bot re-applies Member/Pro roles. */
export async function markDiscordRoleSyncPending(userId: string): Promise<void> {
  const cfg = getDiscordConfig();
  if (!cfg.enabled) return;

  const db = createServiceClient();
  const { error } = await db
    .from("discord_accounts")
    .update({ last_synced_at: null } as never)
    .eq("user_id", userId)
    .eq("guild_id", cfg.guildId);

  if (error) {
    console.error("[discord/sync] mark pending failed", error);
  }
}
