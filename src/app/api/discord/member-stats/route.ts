import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";
import { fetchUserRecentCalls } from "@/lib/users/profile";
import { getAppUrl } from "@/lib/stripe/config";

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
    const { data: link } = await db
      .from("discord_accounts")
      .select("user_id")
      .eq("guild_id", q.guildId)
      .eq("discord_user_id", q.discordUserId)
      .maybeSingle();

    if (!link?.user_id) {
      return NextResponse.json({ ok: true, linked: false });
    }

    const { data: user, error } = await db
      .from("users")
      .select(
        "id, username, display_name, calls_count, win_rate, rank_score, membership_tier, subscription_status"
      )
      .eq("id", link.user_id)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const recent = await fetchUserRecentCalls(user.id, 5);
    const appUrl = getAppUrl();

    return NextResponse.json({
      ok: true,
      linked: true,
      username: user.username,
      displayName: user.display_name,
      profileUrl: `${appUrl}/member/${user.username}`,
      callsCount: user.calls_count,
      winRate: user.win_rate,
      rankScore: user.rank_score,
      membershipTier: user.membership_tier,
      subscriptionStatus: user.subscription_status,
      recentCalls: recent.map((c) => ({
        symbol: c.symbol,
        direction: c.direction,
        returnPct: c.return_pct,
        calledAt: c.called_at,
        isFueled: c.is_fueled,
      })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/member-stats]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
