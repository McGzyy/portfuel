import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { renderWeeklyDigestOgPng } from "@/lib/charts/weekly-digest-og";
import { fetchWeeklyDigestRows } from "@/lib/social/weekly-digest";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const rows = await fetchWeeklyDigestRows(3);
    if (rows.length === 0) {
      return NextResponse.json({ error: "no_content" }, { status: 404 });
    }
    const png = await renderWeeklyDigestOgPng(rows);
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        ...(download
          ? { "Content-Disposition": 'attachment; filename="portfuel-weekly-digest.png"' }
          : {}),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/weekly-digest/chart]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
