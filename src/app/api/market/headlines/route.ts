import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import {
  fetchMarketHeadlinesByLane,
  parseMarketHeadlineLane,
} from "@/lib/market/market-headlines";
import { fetchWatchlist } from "@/lib/watchlist/service";

export async function GET(request: Request) {
  try {
    const session = await requireActiveMember();
    const { searchParams } = new URL(request.url);
    const lane = parseMarketHeadlineLane(searchParams.get("lane") ?? undefined);

    let watchlistSymbols: string[] = [];
    try {
      const watchlist = await fetchWatchlist(session.userId);
      watchlistSymbols = watchlist.map((w) => w.symbol);
    } catch {
      /* optional */
    }

    const headlines = await fetchMarketHeadlinesByLane(lane, watchlistSymbols);
    return NextResponse.json({ lane, headlines, watchlistCount: watchlistSymbols.length });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[market/headlines GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
