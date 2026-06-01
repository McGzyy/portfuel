import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const querySchema = z.object({
  guildId: z.string().min(1),
  discordUserId: z.string().min(1),
});

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const q = querySchema.parse({
      guildId: url.searchParams.get("guildId"),
      discordUserId: url.searchParams.get("discordUserId"),
    });

    const db = createServiceClient();
    const { data: acct, error: acctError } = await db
      .from("discord_accounts")
      .select("user_id")
      .eq("guild_id", q.guildId)
      .eq("discord_user_id", q.discordUserId)
      .maybeSingle();

    if (acctError) {
      return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
    }
    if (!acct?.user_id) {
      return NextResponse.json({ ok: true, linked: false });
    }

    const { data: user, error: userError } = await db
      .from("users")
      .select("id, role, subscription_status, membership_tier, username, display_name")
      .eq("id", acct.user_id)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: "user_lookup_failed" }, { status: 500 });
    }

    const isActive = user.role === "admin" || user.subscription_status === "active";
    const isPro =
      user.role === "admin" ||
      (user.subscription_status === "active" && user.membership_tier === "pro");

    return NextResponse.json({
      ok: true,
      linked: true,
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      subscriptionStatus: user.subscription_status,
      membershipTier: user.membership_tier,
      isActive,
      isPro,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/entitlements]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

