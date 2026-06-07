import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dismissAnnouncement } from "@/lib/announcements/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await dismissAnnouncement(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[announcements/dismiss]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
