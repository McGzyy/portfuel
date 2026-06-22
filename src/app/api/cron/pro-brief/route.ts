import { NextResponse } from "next/server";
import { runProMorningBriefBatch } from "@/lib/email/pro-brief";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProMorningBriefBatch();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron pro-brief]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
