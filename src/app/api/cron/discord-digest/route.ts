import { NextResponse } from "next/server";
import { buildWeeklyDigestEmbed } from "@/lib/discord/embed-payloads";
import { getDiscordDisclaimerMarkdown, weeklyDigestDiscordContent } from "@/lib/discord/discord-copy";
import { getDiscordConfig } from "@/lib/discord/config";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import { getAppUrl } from "@/lib/stripe/config";
import { fetchWeeklyDigestRows } from "@/lib/social/weekly-digest";

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

    const rows = await fetchWeeklyDigestRows(3);
    const appUrl = getAppUrl();
    const feedUrl = `${appUrl}/dashboard/feed`;
    const weekKey = new Date().toISOString().slice(0, 10);
    const [content, disclaimer] = await Promise.all([
      weeklyDigestDiscordContent(),
      getDiscordDisclaimerMarkdown(),
    ]);

    await enqueueDiscordOutbox({
      channelId: cfg.channels.announcements,
      eventType: "digest.weekly",
      dedupeKey: `digest:${weekKey}`,
      payload: {
        content,
        attachChart: rows.length > 0,
        weeklyDigestChart: rows.length > 0,
        embed: buildWeeklyDigestEmbed({ rows, feedUrl, appUrl, disclaimer }),
      },
    });

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error("[cron/discord-digest]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
