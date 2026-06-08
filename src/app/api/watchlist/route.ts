import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import {
  addToWatchlist,
  fetchWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const items = await fetchWatchlist(session.userId);
    return NextResponse.json({ items });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[watchlist GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const addSchema = z.object({
  symbol: z.string().min(1).max(12),
  thesis: z.string().max(4000).optional(),
  conviction: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const body = addSchema.parse(await request.json());
    const result = await addToWatchlist(session.userId, body.symbol, {
      thesis: body.thesis,
      conviction: body.conviction,
    });
    if ("error" in result) {
      const status =
        result.error === "watchlist_full"
          ? 409
          : result.error === "demo_readonly"
            ? 403
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    try {
      const items = await fetchWatchlist(session.userId);
      return NextResponse.json({ ok: true, items });
    } catch (fetchErr) {
      console.error("[watchlist POST fetch after add]", fetchErr);
      return NextResponse.json({
        ok: true,
        items: [],
        partial: true,
        warning: "watchlist_reload_failed",
      });
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireActiveMember();
    const symbol = new URL(request.url).searchParams.get("symbol") ?? "";
    const result = await removeFromWatchlist(session.userId, symbol);
    if ("error" in result) {
      const status =
        result.error === "demo_readonly"
          ? 403
          : result.error === "archive_failed"
            ? 503
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    try {
      const items = await fetchWatchlist(session.userId);
      return NextResponse.json({ ok: true, items, archived: result.archived });
    } catch (fetchErr) {
      console.error("[watchlist DELETE fetch after remove]", fetchErr);
      return NextResponse.json({
        ok: true,
        items: [],
        partial: true,
        archived: result.archived,
      });
    }
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
