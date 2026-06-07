import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { fetchWatchlistRemoveSummary } from "@/lib/watchlist/journal-archive";

type RouteContext = { params: Promise<{ symbol: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol: raw } = await context.params;
    const summary = await fetchWatchlistRemoveSummary(session.userId, raw);
    if (!summary) {
      return NextResponse.json({ error: "not_on_watchlist" }, { status: 404 });
    }
    return NextResponse.json({ summary });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist remove-summary GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
