import { NextResponse } from "next/server";
import { runXSocialBatch } from "@/lib/social/x-run";
import { getXConfig } from "@/lib/social/x-config";

/** Weekly leaderboard + optional Fueled highlight. See docs/X-SOCIAL.md */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const config = getXConfig();
  if (!config.enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "x_disabled" });
  }

  try {
    const types: Array<"leaderboard" | "fueled"> = [];
    if (config.leaderboardPosts) types.push("leaderboard");
    if (config.fueledPosts) types.push("fueled");

    const { results } = await runXSocialBatch({ types });
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("[cron x-social]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
