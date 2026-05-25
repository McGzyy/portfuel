import { NextResponse } from "next/server";
import { requireProSession } from "@/lib/auth/require-pro";
import { fetchCommunityScreener, screenerToCsv } from "@/lib/screener/community";

export async function GET() {
  try {
    await requireProSession();
    const data = await fetchCommunityScreener();
    const csv = screenerToCsv(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="portfuel-community-screener.csv"',
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "pro_required") {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }
    console.error("[pro/screener/export]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
