import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { userHasRecentCancellationFeedback } from "@/lib/billing/cancellation-feedback";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const hasRecent = await userHasRecentCancellationFeedback(session.userId);
    return NextResponse.json({ hasRecent });
  } catch (e) {
    console.error("[billing/cancellation-feedback/recent]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
