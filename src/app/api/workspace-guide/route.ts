import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  markWorkspaceGuideSeen,
  shouldAutoShowWorkspaceGuide,
} from "@/lib/onboarding/workspace-guide";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const autoShow = await shouldAutoShowWorkspaceGuide(session.userId, session.role);
    return NextResponse.json({ autoShow });
  } catch (e) {
    console.error("[workspace-guide GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    await markWorkspaceGuideSeen(session.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[workspace-guide POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
