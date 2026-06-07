import { NextResponse } from "next/server";
import { renderMarketingOgPng } from "@/lib/charts/marketing-render";
import type { MarketingOgVariant } from "@/lib/marketing/brand-kit";

const VARIANTS: MarketingOgVariant[] = ["home", "join", "proof", "desk", "demo"];

/** Public marketing OG PNG for ads and manual link previews (`?variant=join`). */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("variant");
  const v: MarketingOgVariant = VARIANTS.includes(raw as MarketingOgVariant)
    ? (raw as MarketingOgVariant)
    : "home";

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
