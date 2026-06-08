import { NextResponse } from "next/server";
import { loadTrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { renderTrackRecordCardPng } from "@/lib/charts/track-record-card-render";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const loaded = await loadTrackRecordCardPayload(username);
    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: 404 });
    }

    const png = await renderTrackRecordCardPng(loaded.payload);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (e) {
    console.error("[social/track-record]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
