import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchUnreadCount } from "@/lib/notifications/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const count = await fetchUnreadCount(session.userId);
    return NextResponse.json({ count });
  } catch (e) {
    console.error("[notifications/unread]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
