import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { POSITION_INTENTS } from "@/lib/watchlist/journal-meta";
import { setWatchlistPositionIntent } from "@/lib/watchlist/position-intent";

const patchSchema = z.object({
  intent: z.enum(POSITION_INTENTS),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase().trim();
    const body = patchSchema.parse(await request.json());

    const result = await setWatchlistPositionIntent(session.userId, symbol, body.intent);

    if ("error" in result) {
      const status =
        result.error === "demo_readonly"
          ? 403
          : result.error === "not_on_watchlist"
            ? 404
            : result.error === "schema_pending"
              ? 503
              : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, symbol, intent: result.intent });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[watchlist intent PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
