import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import { getDiscordConfig } from "@/lib/discord/config";

export async function POST() {
  try {
    const session = await requireSession();
    const cfg = getDiscordConfig();
    const db = createServiceClient();

    const { error } = await db
      .from("discord_accounts")
      .delete()
      .eq("user_id", session.userId)
      .eq("guild_id", cfg.guildId);

    if (error) {
      return NextResponse.json({ error: "unlink_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
