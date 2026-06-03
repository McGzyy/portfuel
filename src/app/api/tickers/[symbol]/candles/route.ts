import { NextResponse } from "next/server";
import { finnhubCandlesToPoints } from "@/lib/charts/candles";
import type { ChartCandleResolution } from "@/lib/charts/types";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";
import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import { getEquityCandles } from "@/lib/market/equity-candles";
import { getCryptoCandles } from "@/lib/market/finnhub";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

function parseResolution(raw: string | null): ChartCandleResolution {
  if (raw === "60" || raw === "15") return raw;
  return "D";
}

function windowForResolution(resolution: ChartCandleResolution): { from: number; to: number } {
  const to = Math.floor(Date.now() / 1000);
  if (resolution === "D") {
    return { from: to - 365 * 86400, to };
  }
  if (resolution === "60") {
    return { from: to - 30 * 86400, to };
  }
  return { from: to - 7 * 86400, to };
}

function demoCandles(symbol: string, resolution: ChartCandleResolution) {
  const { from, to } = windowForResolution(resolution);
  const step = resolution === "D" ? 86400 : resolution === "60" ? 3600 : 900;
  const points = [];
  let price = 100 + symbol.charCodeAt(0) % 40;
  for (let t = from; t <= to; t += step) {
    const drift = Math.sin(t / 50000) * 2;
    const open = price;
    const close = price + drift;
    const high = Math.max(open, close) + 1;
    const low = Math.min(open, close) - 1;
    points.push({
      time: t,
      open,
      high,
      low,
      close,
      volume: Math.floor(1_000_000 + Math.random() * 500_000),
    });
    price = close;
  }
  return points;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase();
    const { searchParams } = new URL(request.url);
    const resolution = parseResolution(searchParams.get("resolution"));

    if (resolution !== "D") {
      const session = await getSession();
      const proOk = canAccessProIntelligence(sessionToProContext(session));
      if (!proOk) {
        return NextResponse.json({ error: "pro_required" }, { status: 403 });
      }
    }

    if (isDemoMode()) {
      return NextResponse.json({
        symbol,
        resolution,
        candles: demoCandles(symbol, resolution),
      });
    }

    const { from, to } = windowForResolution(resolution);
    const crypto = await resolveCryptoAsset(symbol);

    let rawCandles = null;
    if (crypto?.finnhub_symbol) {
      rawCandles = await getCryptoCandles(crypto.finnhub_symbol, from, to, resolution);
    } else if (resolution === "D") {
      rawCandles = await getEquityCandles(symbol, from, to, "D");
    } else {
      rawCandles = await getEquityCandles(symbol, from, to, resolution);
    }

    const candles = finnhubCandlesToPoints(rawCandles);

    return NextResponse.json({ symbol, resolution, candles });
  } catch (e) {
    console.error("[ticker/candles]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
