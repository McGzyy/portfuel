import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/supabase";
import { getEquityCandles } from "@/lib/market/equity-candles";
import { getQuote, getCompanyProfile } from "@/lib/market/finnhub";
import { fetchCallsBySymbol } from "@/lib/calls/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase();

    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 86400;

    const [candles, quote, profile, calls] = await Promise.all([
      getEquityCandles(symbol, from, to, "D"),
      getQuote(symbol),
      getCompanyProfile(symbol),
      fetchCallsBySymbol(symbol),
    ]);

    const db = createServiceClient();
    const { data: hype } = await db
      .from("hype_scores")
      .select("score")
      .eq("symbol", symbol)
      .maybeSingle();

    const candlePoints =
      candles?.t?.map((t, i) => ({
        time: t,
        open: candles.o[i],
        high: candles.h[i],
        low: candles.l[i],
        close: candles.c[i],
        volume: candles.v?.[i] != null ? Number(candles.v[i]) : undefined,
      })) ?? [];

    const markers = calls.map((c) => {
      const calledTs = Math.floor(new Date(c.called_at).getTime() / 1000);
      const dayStart = Math.floor(calledTs / 86400) * 86400;
      const name = c.users.display_name ?? c.users.pin;
      return {
        time: dayStart,
        price: Number(c.price_at_call ?? c.entry_price ?? quote?.c ?? 0),
        label: `${name} ${c.direction}`,
        color: c.is_fueled ? "#E31B23" : c.direction === "long" ? "#10b981" : "#f43f5e",
      };
    });

    return NextResponse.json({
      symbol,
      companyName: profile?.name ?? symbol,
      quote: quote ? { price: quote.c, changePct: quote.dp } : null,
      hypeScore: hype?.score ?? 0,
      candles: candlePoints,
      markers,
      calls,
    });
  } catch (e) {
    console.error("[chart]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
