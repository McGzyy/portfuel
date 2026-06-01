import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { fetchReferralStats } from "@/lib/referrals/service";

export async function GET() {
  try {
    const session = await requireSession();
    const stats = await fetchReferralStats(session.userId, session.username);
    return NextResponse.json(stats);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[referrals GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
