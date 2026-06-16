import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";

export async function enqueueDiscordOutbox(input: {
  channelId: string;
  eventType: string;
  payload: Record<string, unknown>;
  /** Skip insert when the same key was already queued or sent (24h window). */
  dedupeKey?: string;
}): Promise<string | null> {
  const cfg = getDiscordConfig();
  if (!cfg.enabled) return null;

  const db = createServiceClient();
  const payload = input.dedupeKey
    ? { ...input.payload, dedupeKey: input.dedupeKey }
    : input.payload;

  if (input.dedupeKey) {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const { data: existing } = await db
      .from("discord_outbox")
      .select("id")
      .eq("guild_id", cfg.guildId)
      .eq("event_type", input.eventType)
      .eq("channel_id", input.channelId)
      .gte("created_at", since)
      .in("status", ["pending", "sent"])
      .filter("payload->>dedupeKey", "eq", input.dedupeKey)
      .limit(1)
      .maybeSingle();

    if (existing?.id) return String(existing.id);
  }

  const { data, error } = await db
    .from("discord_outbox")
    .insert({
      guild_id: cfg.guildId,
      channel_id: input.channelId,
      event_type: input.eventType,
      payload,
    } as never)
    .select("id")
    .single();

  if (error) {
    console.error("[discord/outbox]", error);
    return null;
  }
  return data?.id ? String(data.id) : null;
}
