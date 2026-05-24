import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { fetchAdminAnalytics } from "@/lib/admin/analytics";

export async function GET() {
  try {
    await requireAdmin();
    const analytics = await fetchAdminAnalytics();
    return NextResponse.json(analytics);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/analytics]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
