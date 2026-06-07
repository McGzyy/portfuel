import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { PRICE_ALERT_PCT_OPTIONS } from "@/lib/alerts/price-threshold";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { updateWatchlistPriceAlert } from "@/lib/watchlist/service";

const patchSchema = z.object({
  priceAlertPct: z
    .union([
      z.null(),
      z.number().int().min(PRICE_ALERT_PCT_OPTIONS[0]).max(20),
    ])
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const session = await requireActiveMember();
    const proUnlocked = canAccessProIntelligence(sessionToProContext(session));
    if (!proUnlocked) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase().trim();
    const body = patchSchema.parse(await request.json());

    if (body.priceAlertPct === undefined) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const result = await updateWatchlistPriceAlert(
      session.userId,
      symbol,
      body.priceAlertPct
    );

    if ("error" in result) {
      const status =
        result.error === "demo_readonly"
          ? 403
          : result.error === "not_found"
            ? 404
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, symbol, priceAlertPct: body.priceAlertPct });
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
    console.error("[watchlist price-alert PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
