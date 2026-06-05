import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import {
  fetchWatchlistJournal,
  updateWatchlistJournal,
} from "@/lib/watchlist/journal";

type RouteContext = { params: Promise<{ symbol: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol } = await context.params;
    const journal = await fetchWatchlistJournal(session.userId, symbol);
    if (!journal) {
      return NextResponse.json({ error: "not_on_watchlist" }, { status: 404 });
    }
    return NextResponse.json({ journal });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist journal GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  thesis: z.string().max(4000).nullable().optional(),
  conviction: z.number().int().min(1).max(10).nullable().optional(),
  entry_price: z.number().positive().nullable().optional(),
  stop_price: z.number().positive().nullable().optional(),
  target_price: z.number().positive().nullable().optional(),
  entry_note: z.string().max(500).nullable().optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol } = await context.params;
    const body = patchSchema.parse(await request.json());
    const result = await updateWatchlistJournal(session.userId, symbol, body);
    if ("error" in result) {
      const status =
        result.error === "not_on_watchlist"
          ? 404
          : result.error === "demo_readonly"
            ? 403
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, journal: result.journal });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist journal PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
