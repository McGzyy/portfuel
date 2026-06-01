import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";

const DEFAULT_GUILD_ID = process.env.DISCORD_GUILD_ID ?? "1508150607285063850";

export async function GET() {
  try {
    const session = await requireSession();
    const db = createServiceClient();

    const { data, error } = await db
      .from("discord_accounts")
      .select("discord_user_id, linked_at, last_synced_at")
      .eq("user_id", session.userId)
      .eq("guild_id", DEFAULT_GUILD_ID)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: true, linked: false });
    }

    const isActive =
      session.role === "admin" || session.subscriptionStatus === "active";
    const isPro =
      session.role === "admin" ||
      (session.subscriptionStatus === "active" && session.membershipTier === "pro");

    return NextResponse.json({
      ok: true,
      linked: true,
      discordUserId: data.discord_user_id,
      linkedAt: data.linked_at,
      lastSyncedAt: data.last_synced_at,
      subscriptionStatus: session.subscriptionStatus,
      membershipTier: session.membershipTier ?? null,
      isActive,
      isPro,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[discord/link/status]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
