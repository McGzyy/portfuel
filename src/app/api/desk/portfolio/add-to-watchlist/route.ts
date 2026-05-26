import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { addOpenPortfolioToWatchlist } from "@/lib/watchlist/service";

export async function POST() {
  try {
    const session = await requireActiveMember();
    const result = await addOpenPortfolioToWatchlist(session.userId);

    if ("error" in result) {
      const status = result.error === "demo_readonly" ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[desk/portfolio/add-to-watchlist POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
