import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";
import { buildWeeklyDigestEmbed } from "@/lib/discord/embed-payloads";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const cfg = getDiscordConfig();
    if (!cfg.enabled) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const db = createServiceClient();
    const since = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: calls, error } = await db
      .from("calls")
      .select("id, symbol, direction, return_pct, is_fueled, users!inner(display_name, username, subscription_status)")
      .eq("users.subscription_status", "active")
      .not("return_pct", "is", null)
      .gte("called_at", since)
      .order("return_pct", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }

    const movers = (calls ?? []).map((c) => {
      const uRaw = (c as unknown as { users: unknown }).users;
      const u = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as
        | { display_name: string | null; username: string }
        | undefined;
      const who = u?.display_name?.trim() || u?.username || "Member";
      return {
        symbol: c.symbol,
        direction: String(c.direction),
        returnPct: Number(c.return_pct),
        isFueled: Boolean(c.is_fueled),
        who,
      };
    });

    const appUrl = getAppUrl();
    const feedUrl = `${appUrl}/dashboard/feed`;
    const weekKey = new Date().toISOString().slice(0, 10);

    await enqueueDiscordOutbox({
      channelId: cfg.channels.announcements,
      eventType: "digest.weekly",
      dedupeKey: `digest:${weekKey}`,
      payload: {
        content: "📊 **Weekly digest** · Top member movers",
        embed: buildWeeklyDigestEmbed({ movers, feedUrl, appUrl }),
      },
    });

    return NextResponse.json({ ok: true, count: movers.length });
  } catch (e) {
    console.error("[cron/discord-digest]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
