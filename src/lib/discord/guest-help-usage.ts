import { DISCORD_GUEST_HELP_LIMIT } from "@/lib/ai/config";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export type GuestHelpUsageStatus = {
  used: number;
  limit: number;
  remaining: number;
};

export async function fetchGuestHelpUsage(
  discordUserId: string
): Promise<GuestHelpUsageStatus> {
  const limit = DISCORD_GUEST_HELP_LIMIT;

  if (isDemoMode()) {
    return { used: 0, limit, remaining: limit };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("discord_guest_help_usage")
    .select("questions_used")
    .eq("discord_user_id", discordUserId)
    .maybeSingle();

  const used = (data as { questions_used: number } | null)?.questions_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function consumeGuestHelpQuestion(discordUserId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("discord_guest_help_usage")
    .select("questions_used")
    .eq("discord_user_id", discordUserId)
    .maybeSingle();

  const next = ((existing as { questions_used: number } | null)?.questions_used ?? 0) + 1;

  if (existing) {
    const { error } = await db
      .from("discord_guest_help_usage")
      .update({ questions_used: next, updated_at: now } as never)
      .eq("discord_user_id", discordUserId);
    if (error) throw error;
  } else {
    const { error } = await db.from("discord_guest_help_usage").insert({
      discord_user_id: discordUserId,
      questions_used: 1,
      updated_at: now,
    } as never);
    if (error) throw error;
  }

  return next;
}
