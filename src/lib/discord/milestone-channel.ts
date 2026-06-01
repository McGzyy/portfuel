import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";

/** Member or Pro member chat — where milestone charts and link welcomes post. */
export async function resolveTierChatChannelId(userId: string): Promise<string> {
  const { channels } = getDiscordConfig();
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("subscription_status, membership_tier")
    .eq("id", userId)
    .maybeSingle();

  if (data?.subscription_status === "active" && data.membership_tier === "pro") {
    return channels.proMemberChat;
  }
  return channels.memberChat;
}
