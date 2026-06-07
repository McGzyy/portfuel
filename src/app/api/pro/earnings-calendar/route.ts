import { NextResponse } from "next/server";
import { requireProSession } from "@/lib/auth/require-pro";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import { fetchWatchlist } from "@/lib/watchlist/service";

export async function GET() {
  try {
    const session = await requireProSession();

    let watchlist: Awaited<ReturnType<typeof fetchWatchlist>> = [];
    try {
      watchlist = await fetchWatchlist(session.userId);
    } catch (e) {
      console.error("[pro/earnings-calendar/watchlist]", e);
      return NextResponse.json({
        events: [],
        warning: "watchlist_unavailable",
      });
    }

    const symbols = watchlist
      .filter((w) => w.asset_class === "equity")
      .map((w) => w.symbol);

    const events = await fetchEarningsForSymbols(symbols, 14);

    return NextResponse.json({ events });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "pro_required") {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }
    console.error("[pro/earnings-calendar]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
