import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const querySchema = z.object({
  guildId: z.string().min(1),
  hours: z.coerce.number().int().min(1).max(168).default(24),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const q = querySchema.parse({
      guildId: url.searchParams.get("guildId"),
      hours: url.searchParams.get("hours") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const cutoff = new Date(Date.now() - q.hours * 3600000).toISOString();
    const db = createServiceClient();

    const { data: rows, error } = await db
      .from("discord_human_verified")
      .select("discord_user_id, verified_at")
      .eq("guild_id", q.guildId)
      .is("link_reminder_sent_at", null)
      .lt("verified_at", cutoff)
      .limit(q.limit);

    if (error) {
      return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
    }

    const due: { discordUserId: string; verifiedAt: string }[] = [];

    for (const row of rows ?? []) {
      const discordUserId = String(row.discord_user_id);
      const { data: linked } = await db
        .from("discord_accounts")
        .select("id")
        .eq("guild_id", q.guildId)
        .eq("discord_user_id", discordUserId)
        .maybeSingle();

      if (linked?.id) continue;
      due.push({ discordUserId, verifiedAt: String(row.verified_at) });
    }

    return NextResponse.json({ ok: true, items: due });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
