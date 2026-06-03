import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/supabase";
import { refreshQuotesForSymbols } from "@/lib/calls/service";

/** Refresh return metrics for all symbols the current member has called. */
export async function POST() {
  try {
    const session = await requireSession();
    const db = createServiceClient();
    const { data, error } = await db
      .from("calls")
      .select("symbol")
      .eq("user_id", session.userId);

    if (error) throw error;

    const symbols = [...new Set((data ?? []).map((r) => String(r.symbol).toUpperCase()))];
    if (symbols.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, quotes: [] });
    }

    const result = await refreshQuotesForSymbols(symbols);
    const failed = result.quotes.filter((q) => q.lastPrice == null);

    return NextResponse.json({
      ok: true,
      ...result,
      ...(failed.length > 0
        ? { warning: `No price for: ${failed.map((q) => q.symbol).join(", ")}` }
        : {}),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[calls/refresh-quotes]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
