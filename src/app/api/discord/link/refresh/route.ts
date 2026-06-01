import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";

export async function POST() {
  try {
    const session = await requireSession();
    await markDiscordRoleSyncPending(session.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
