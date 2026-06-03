import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { fetchSocialActivitySnapshot } from "@/lib/social/social-activity";
import { xConfigSummary } from "@/lib/social/x-config";

export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await fetchSocialActivitySnapshot();
    return NextResponse.json({ ...snapshot, x: xConfigSummary() });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/activity]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
