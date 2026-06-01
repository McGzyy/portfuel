import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const schema = z.object({
  guildId: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(5),
  workerId: z.string().min(1).max(64).default("bot"),
});

export async function POST(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const body = schema.parse(await request.json());
    const db = createServiceClient();
    const now = new Date().toISOString();

    const { data: rows, error } = await db
      .from("discord_outbox")
      .select("id, guild_id, channel_id, event_type, payload")
      .eq("guild_id", body.guildId)
      .eq("status", "pending")
      .is("locked_at", null)
      .order("created_at", { ascending: true })
      .limit(body.limit);

    if (error) {
      return NextResponse.json({ error: "pull_failed" }, { status: 500 });
    }

    const ids = (rows ?? []).map((r) => String(r.id));
    if (ids.length === 0) return NextResponse.json({ ok: true, items: [] });

    // Best-effort lock (not perfectly atomic, but good enough for single worker MVP).
    await db
      .from("discord_outbox")
      .update({ locked_at: now, locked_by: body.workerId } as never)
      .in("id", ids)
      .eq("status", "pending");

    const items = (rows ?? []).map((r) => ({
      id: String(r.id),
      guildId: String(r.guild_id),
      channelId: String(r.channel_id),
      eventType: String(r.event_type),
      payload: (r.payload ?? {}) as Record<string, unknown>,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/outbox/pull]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

