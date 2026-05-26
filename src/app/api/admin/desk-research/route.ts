import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { fetchDeskWeekResearch } from "@/lib/desk/research";

export async function GET() {
  try {
    await requireAdmin();
    const research = await fetchDeskWeekResearch();
    return NextResponse.json(research);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/desk-research GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
