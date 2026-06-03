import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { fetchReferralHistory } from "@/lib/referrals/service";

export async function GET() {
  try {
    const session = await requireSession();
    const history = await fetchReferralHistory(session.userId);
    return NextResponse.json({ history });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[referrals/history]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
