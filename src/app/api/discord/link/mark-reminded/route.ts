import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const schema = z.object({
  guildId: z.string().min(1),
  discordUserId: z.string().min(1),
});

export async function POST(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const body = schema.parse(await request.json());
    const db = createServiceClient();
    const now = new Date().toISOString();

    const { error } = await db
      .from("discord_human_verified")
      .update({ link_reminder_sent_at: now } as never)
      .eq("guild_id", body.guildId)
      .eq("discord_user_id", body.discordUserId);

    if (error) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
