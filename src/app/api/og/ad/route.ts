import { NextResponse } from "next/server";
import { renderMarketingAdPng } from "@/lib/charts/marketing-render";
import type { MarketingAdVariant, MarketingSizeKey } from "@/lib/marketing/brand-kit";
import { loadMarketingCallContext } from "@/lib/marketing/marketing-call-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VARIANTS: MarketingAdVariant[] = ["proof", "structure", "desk"];
const SIZES: MarketingSizeKey[] = ["x", "og", "square"];

const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
} as const;

/** Programmatic ad card PNGs for paid social and Figma compositing. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawVariant = params.get("variant") ?? "proof";
  const rawSize = params.get("size") ?? "x";
  const headline = params.get("headline") ?? undefined;

  const variant: MarketingAdVariant = VARIANTS.includes(rawVariant as MarketingAdVariant)
    ? (rawVariant as MarketingAdVariant)
    : "proof";
  const size: MarketingSizeKey = SIZES.includes(rawSize as MarketingSizeKey)
    ? (rawSize as MarketingSizeKey)
    : "x";

  try {
    const ctx = await loadMarketingCallContext();
    const png = await renderMarketingAdPng({ variant, size, headline, ctx });
    return new NextResponse(new Uint8Array(png), { headers: PNG_HEADERS });
  } catch (e) {
    console.error("[og/ad]", e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
