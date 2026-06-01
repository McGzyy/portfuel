import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import { notifyDiscordAccountLinked } from "@/lib/discord/events";
import { canAccessProIntelligence, sessionToProContext } from "@/lib/features/pro-intelligence";

const schema = z.object({
  token: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    const db = createServiceClient();

    const { data: tokenRow, error: tokenError } = await db
      .from("discord_link_tokens")
      .select("*")
      .eq("token", body.token)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(String(tokenRow.expires_at));
    if (tokenRow.consumed_at) {
      return NextResponse.json({ error: "token_consumed" }, { status: 409 });
    }
    if (!(expiresAt.getTime() > now.getTime())) {
      return NextResponse.json({ error: "token_expired" }, { status: 410 });
    }

    const guildId = String(tokenRow.guild_id);
    const discordUserId = String(tokenRow.discord_user_id);

    const { error: upsertError } = await db
      .from("discord_accounts")
      .upsert(
        {
          user_id: session.userId,
          guild_id: guildId,
          discord_user_id: discordUserId,
          linked_at: now.toISOString(),
          last_synced_at: null,
        } as never,
        { onConflict: "guild_id,discord_user_id" }
      );

    if (upsertError) {
      // Could be unique (guild_id, user_id) already linked to someone else.
      return NextResponse.json({ error: "link_failed" }, { status: 409 });
    }

    const { error: consumeError } = await db
      .from("discord_link_tokens")
      .update({
        consumed_at: now.toISOString(),
        consumed_by_user_id: session.userId,
      } as never)
      .eq("token", body.token);

    if (consumeError) {
      return NextResponse.json({ error: "consume_failed" }, { status: 500 });
    }

    await db
      .from("discord_human_verified")
      .delete()
      .eq("guild_id", guildId)
      .eq("discord_user_id", discordUserId);

    const proCtx = sessionToProContext(session);
    const isActive = session.role === "admin" || session.subscriptionStatus === "active";
    const isPro = canAccessProIntelligence(proCtx);

    void notifyDiscordAccountLinked({
      displayName: session.displayName,
      username: session.username,
      isActive,
      isPro,
    }).catch((e) => console.error("[discord/link-welcome]", e));

    return NextResponse.json({ ok: true, guildId, discordUserId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[discord/link/consume]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

