import { NextResponse } from "next/server";
import { renderWeeklyDigestChartPng } from "@/lib/social/weekly-digest";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(5, Math.max(1, Number(url.searchParams.get("limit") ?? "3")));
    const png = await renderWeeklyDigestChartPng(limit);
    if (!png) {
      return NextResponse.json({ error: "no_content" }, { status: 404 });
    }

    const download = url.searchParams.get("download") === "1";
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
    console.error("[social/weekly-digest/chart]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
