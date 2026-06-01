import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const schema = z.object({
  guildId: z.string().min(1),
  channelId: z.string().min(1),
  eventType: z.string().min(1).max(64),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const body = schema.parse(await request.json());
    const db = createServiceClient();

    const { data, error } = await db
      .from("discord_outbox")
      .insert({
        guild_id: body.guildId,
        channel_id: body.channelId,
        event_type: body.eventType,
        payload: body.payload,
      } as never)
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json({ error: "enqueue_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/outbox/enqueue]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

