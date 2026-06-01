import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";

export async function enqueueDiscordOutbox(input: {
  channelId: string;
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<string | null> {
  const cfg = getDiscordConfig();
  if (!cfg.enabled) return null;

  const db = createServiceClient();
  const { data, error } = await db
    .from("discord_outbox")
    .insert({
      guild_id: cfg.guildId,
      channel_id: input.channelId,
      event_type: input.eventType,
      payload: input.payload,
    } as never)
    .select("id")
    .single();

  if (error) {
    console.error("[discord/outbox]", error);
    return null;
  }
  return data?.id ? String(data.id) : null;
}
