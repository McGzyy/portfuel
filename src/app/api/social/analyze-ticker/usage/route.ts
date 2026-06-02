import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { createServiceClient } from "@/lib/db/supabase";
import { AI_ASSIST_LIMITS } from "@/lib/ai/ai-assist-limits";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const tier = effectiveMembershipTier(session.membershipTier, session.proGrantedUntil);
    if (session.role !== "admin" && tier !== "pro") {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const db = createServiceClient();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const [def, deep] = await Promise.all([
      db
        .from("ai_draft_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.userId)
        .eq("mode", "default")
        .gte("created_at", start.toISOString()),
      db
        .from("ai_draft_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.userId)
        .eq("mode", "deep")
        .gte("created_at", start.toISOString()),
    ]);

    const usedDefault = def.count ?? 0;
    const usedDeep = deep.count ?? 0;

    return NextResponse.json({
      ok: true,
      period: "today_utc",
      default: {
        used: usedDefault,
        limit: AI_ASSIST_LIMITS.defaultPerDay,
        remaining: Math.max(0, AI_ASSIST_LIMITS.defaultPerDay - usedDefault),
      },
      deep: {
        used: usedDeep,
        limit: AI_ASSIST_LIMITS.deepPerDay,
        remaining: Math.max(0, AI_ASSIST_LIMITS.deepPerDay - usedDeep),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "totp_required") {
      return NextResponse.json({ error: "totp_required" }, { status: 403 });
    }
    console.error("[social/analyze-ticker/usage]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

