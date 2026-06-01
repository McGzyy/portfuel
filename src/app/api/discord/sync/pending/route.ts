import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const querySchema = z.object({
  guildId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const q = querySchema.parse({
      guildId: url.searchParams.get("guildId"),
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const db = createServiceClient();
    const { data: links, error } = await db
      .from("discord_accounts")
      .select("user_id, discord_user_id, last_synced_at")
      .eq("guild_id", q.guildId)
      .is("last_synced_at", null)
      .limit(q.limit);

    if (error) {
      return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
    }

    const userIds = Array.from(new Set((links ?? []).map((l) => String(l.user_id))));
    if (userIds.length === 0) return NextResponse.json({ ok: true, items: [] });

    const { data: users, error: usersError } = await db
      .from("users")
      .select("id, role, subscription_status, membership_tier, username, display_name")
      .in("id", userIds);

    if (usersError) {
      return NextResponse.json({ error: "user_lookup_failed" }, { status: 500 });
    }

    const byId = new Map((users ?? []).map((u) => [String(u.id), u]));
    const items = (links ?? [])
      .map((l) => {
        const u = byId.get(String(l.user_id));
        if (!u) return null;
        const isActive = u.role === "admin" || u.subscription_status === "active";
        const isPro =
          u.role === "admin" ||
          (u.subscription_status === "active" && u.membership_tier === "pro");
        return {
          guildId: q.guildId,
          discordUserId: String(l.discord_user_id),
          userId: String(u.id),
          username: u.username,
          displayName: u.display_name,
          subscriptionStatus: u.subscription_status,
          membershipTier: u.membership_tier,
          isActive,
          isPro,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/sync/pending]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

