import { NextResponse } from "next/server";
import { runWeeklyDigestBatch } from "@/lib/email/digest";
import { isEmailConfigured } from "@/lib/email/config";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "email_not_configured" });
  }

  try {
    const result = await runWeeklyDigestBatch();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron weekly-digest]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
