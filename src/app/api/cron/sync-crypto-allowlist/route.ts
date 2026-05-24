import { NextResponse } from "next/server";
import { syncCryptoAllowlist } from "@/lib/market/crypto-allowlist";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCryptoAllowlist();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron sync-crypto]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
