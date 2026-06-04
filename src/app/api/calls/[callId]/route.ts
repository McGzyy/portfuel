import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { deleteCall } from "@/lib/calls/delete-call";
import { isDemoCallId, isDemoMode } from "@/lib/demo/config";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await requireSession();
    const { callId } = await params;

    if (isDemoMode() && isDemoCallId(callId)) {
      return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
    }

    const result = await deleteCall({
      callId,
      actorUserId: session.userId,
      isAdmin: session.role === "admin",
    });

    if (!result.ok) {
      const status = result.error === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[calls DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
