import { NextResponse } from "next/server";
import {
  renderMarketingOgPng,
  type MarketingOgVariant,
} from "@/lib/charts/marketing-og";

/** Public marketing OG PNG for ads and manual link previews (`?variant=join`). */
export async function GET(request: Request) {
  const variant = new URL(request.url).searchParams.get("variant");
  const v: MarketingOgVariant = variant === "join" ? "join" : "home";

  try {
    const png = await renderMarketingOgPng(v);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[og/marketing]", e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
