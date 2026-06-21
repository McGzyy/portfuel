import { NextResponse } from "next/server";
import { runDiscoveryScan } from "@/lib/desk-discovery/scanner";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDiscoveryScan();
    if ("error" in result) {
      const status = result.error === "migration_missing" ? 503 : 500;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron desk-discovery]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
