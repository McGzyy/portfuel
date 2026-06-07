import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";
import { fetchSparklinesForSymbols } from "@/lib/market/sparklines";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.subscriptionStatus !== "active") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 12);

  const cryptoRaw = searchParams.get("crypto") ?? "";
  const cryptoSymbols = new Set(
    cryptoRaw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );

  if (symbols.length === 0) {
    return NextResponse.json({ series: {} });
  }

  if (isDemoMode()) {
    const demo: Record<string, { time: number; value: number }[]> = {};
    for (const sym of symbols) {
      const base = 100 + sym.charCodeAt(0);
      demo[sym] = Array.from({ length: 20 }, (_, i) => ({
        time: Math.floor(Date.now() / 1000) - (20 - i) * 86400,
        value: base + Math.sin(i / 3) * 4 + i * 0.2,
      }));
    }
    return NextResponse.json({ series: demo });
  }

  try {
    const series = await fetchSparklinesForSymbols(symbols, { cryptoSymbols });
    return NextResponse.json({ series });
  } catch (e) {
    console.error("[sparklines]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
