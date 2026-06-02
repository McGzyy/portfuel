import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/supabase";
import { fetchCallResearchSnapshot } from "@/lib/calls/research-snapshot";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    await requireSession();
    const { callId } = await params;

    const db = createServiceClient();
    const { data: call } = await db.from("calls").select("id, is_fueled").eq("id", callId).maybeSingle();
    if (!call) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!call.is_fueled) return NextResponse.json({ error: "not_fueled" }, { status: 400 });

    const snap = await fetchCallResearchSnapshot(callId);
    if (!snap) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ snapshot: snap });
  } catch (e) {
    if (e instanceof Error && (e.message === "unauthorized" || e.message === "account_banned")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[calls/research]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

