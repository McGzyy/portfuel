import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";
import { getAppUrl } from "@/lib/stripe/config";

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

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data, error } = await db
      .from("discord_link_tokens")
      .insert({
        guild_id: body.guildId,
        discord_user_id: body.discordUserId,
        expires_at: expiresAt,
      } as never)
      .select("token, expires_at")
      .single();

    if (error || !data?.token) {
      return NextResponse.json({ error: "token_create_failed" }, { status: 500 });
    }

    const token = String(data.token);
    const linkUrl = `${getAppUrl()}/discord/link?token=${encodeURIComponent(token)}`;

    return NextResponse.json({ ok: true, token, linkUrl, expiresAt: data.expires_at });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/link/start]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

