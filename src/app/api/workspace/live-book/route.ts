import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { syncLiveBookForUser } from "@/lib/workspace/live-book-sync";

/** Refresh and return live open-call metrics without a full page reload. */
export async function POST() {
  try {
    const session = await requireActiveMember();
    const isPro = canAccessProIntelligence(sessionToProContext(session));
    const payload = await syncLiveBookForUser(session.userId, { isPro });
    return NextResponse.json({ ok: true, ...payload });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[workspace/live-book POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
