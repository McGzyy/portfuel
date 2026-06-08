import { NextResponse } from "next/server";
import { renderMarketingOgPng } from "@/lib/charts/marketing-render";
import type { MarketingOgVariant } from "@/lib/marketing/brand-kit";
import { loadMarketingCallContext } from "@/lib/marketing/marketing-call-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VARIANTS: MarketingOgVariant[] = ["home", "join", "proof", "desk", "demo"];

const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
} as const;

/** Public marketing OG PNG for ads and manual link previews (`?variant=join`). */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("variant");
  const v: MarketingOgVariant = VARIANTS.includes(raw as MarketingOgVariant)
    ? (raw as MarketingOgVariant)
    : "home";

  try {
    const ctx = await loadMarketingCallContext();
    const png = await renderMarketingOgPng(v, ctx);
    return new NextResponse(new Uint8Array(png), { headers: PNG_HEADERS });
  } catch (e) {
    console.error("[og/marketing]", e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
