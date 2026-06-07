import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { fetchWatchlistDigestUsage } from "@/lib/ai/watchlist-digest-usage";
import { runWatchlistDigest } from "@/lib/ai/watchlist-digest";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { fetchWatchlist } from "@/lib/watchlist/service";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const proContext = sessionToProContext(session);
    if (!canAccessProIntelligence(proContext)) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const usage = await fetchWatchlistDigestUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: isAiCoachConfigured(),
    });

    return NextResponse.json(usage);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[pro/watchlist-digest GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await requireActiveMember();
    const proContext = sessionToProContext(session);
    if (!canAccessProIntelligence(proContext)) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const usage = await fetchWatchlistDigestUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: isAiCoachConfigured(),
    });

    if (!usage.configured) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }

    if (usage.remaining <= 0) {
      return NextResponse.json({ error: "limit_reached", usage }, { status: 429 });
    }

    const watchlist = await fetchWatchlist(session.userId);
    if (watchlist.length === 0) {
      return NextResponse.json({ error: "watchlist_empty" }, { status: 400 });
    }

    const digest = await runWatchlistDigest({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      watchlist,
    });

    const usageAfter = await fetchWatchlistDigestUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: isAiCoachConfigured(),
    });

    return NextResponse.json({ digest, usage: usageAfter });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "ai_not_configured") {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    console.error("[pro/watchlist-digest POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
