import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { fetchJournalPlanRevisions } from "@/lib/watchlist/journal-revisions";

type RouteContext = { params: Promise<{ symbol: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol } = await context.params;
    const revisions = await fetchJournalPlanRevisions(session.userId, symbol);
    return NextResponse.json({ revisions });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist journal revisions GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
