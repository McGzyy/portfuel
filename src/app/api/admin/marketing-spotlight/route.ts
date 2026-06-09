import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { MARKETING_RENDER_REVISION } from "@/lib/marketing/brand-kit";
import { loadMarketingSpotlight } from "@/lib/marketing/marketing-call-data";

export async function GET() {
  try {
    await requireAdmin();
    const spotlight = await loadMarketingSpotlight();
    return NextResponse.json({
      ...spotlight,
      renderRevision: MARKETING_RENDER_REVISION,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/marketing-spotlight]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
