import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { refreshQuotesAndScores } from "@/lib/calls/service";

/** Manually run the same job as `/api/cron/refresh-quotes` (local dev + ops). */
export async function POST() {
  try {
    await requireAdmin();
    const result = await refreshQuotesAndScores();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/calls/refresh-quotes]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
