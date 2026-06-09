import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { closeCall } from "@/lib/calls/close-call";
import { isDemoCallId, isDemoMode } from "@/lib/demo/config";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await requireSession();
    const { callId } = await params;

    if (isDemoMode() && isDemoCallId(callId)) {
      return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
    }

    const result = await closeCall({
      callId,
      actorUserId: session.userId,
      isAdmin: session.role === "admin",
    });

    if (!result.ok) {
      const status =
        result.error === "forbidden"
          ? 403
          : result.error === "not_found" || result.error === "no_price"
            ? 404
            : 409;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      returnPct: result.returnPct,
      exitPrice: result.exitPrice,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[calls close POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
