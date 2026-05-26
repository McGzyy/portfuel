import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { countUnreadDmThreads } from "@/lib/messages/service";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const count = await countUnreadDmThreads(session.userId);
    return NextResponse.json({ count });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[messages/unread]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
