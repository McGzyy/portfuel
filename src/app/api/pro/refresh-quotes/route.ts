import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/supabase";
import { refreshQuotesForSymbols } from "@/lib/calls/service";
import { isDemoMode } from "@/lib/demo/config";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { PRO_QUOTES_REFRESH_MINUTES } from "@/lib/market/quote-cadence";
import { fetchWatchlist } from "@/lib/watchlist/service";

const bodySchema = z.object({
  symbols: z.array(z.string().min(1).max(12)).max(32).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const proContext = sessionToProContext(session);
    if (!canAccessProIntelligence(proContext)) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    if (isDemoMode()) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        quotes: [],
        quotesRefreshMinutes: PRO_QUOTES_REFRESH_MINUTES,
        demo: true,
      });
    }

    let symbols: string[] = [];
    const parsed = bodySchema.safeParse(
      request.headers.get("content-type")?.includes("application/json")
        ? await request.json()
        : {}
    );
    if (parsed.success && parsed.data.symbols?.length) {
      symbols = parsed.data.symbols.map((s) => s.toUpperCase());
    } else {
      const [watchlist, callRows] = await Promise.all([
        fetchWatchlist(session.userId),
        createServiceClient()
          .from("calls")
          .select("symbol")
          .eq("user_id", session.userId),
      ]);
      symbols = [
        ...watchlist.map((w) => w.symbol),
        ...((callRows.data ?? []) as { symbol: string }[]).map((r) => r.symbol),
      ];
    }

    const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))].slice(0, 32);
    if (unique.length === 0) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        quotes: [],
        quotesRefreshMinutes: PRO_QUOTES_REFRESH_MINUTES,
      });
    }

    const result = await refreshQuotesForSymbols(unique);
    return NextResponse.json({
      ok: true,
      ...result,
      quotesRefreshMinutes: PRO_QUOTES_REFRESH_MINUTES,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[pro/refresh-quotes POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
