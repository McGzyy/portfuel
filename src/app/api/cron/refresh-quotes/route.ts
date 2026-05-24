import { NextResponse } from "next/server";
import { refreshQuotesAndScores } from "@/lib/calls/service";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshQuotesAndScores();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron refresh-quotes]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
