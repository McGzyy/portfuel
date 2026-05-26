import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { fetchWorkspacePulse } from "@/lib/workspace/pulse";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const pulse = await fetchWorkspacePulse(session.userId);
    return NextResponse.json(pulse);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[workspace/pulse GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
