import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { refreshQuotesAndScores } from "@/lib/calls/service";

/** Manually run the same job as `/api/cron/refresh-quotes` (local dev + ops). */
export async function POST() {
  try {
    await requireAdmin();
    const result = await refreshQuotesAndScores();
    const failed = result.quotes.filter((q) => q.lastPrice == null);
    return NextResponse.json({
      ok: true,
      updated: result.updated,
      milestonesNotified: result.milestonesNotified,
      memberWinGates: result.memberWinGates,
      quotes: result.quotes,
      ...(failed.length > 0
        ? {
            warning:
              "Some symbols did not return a price (check FINNHUB_API_KEY or symbol).",
          }
        : {}),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/calls/refresh-quotes]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
