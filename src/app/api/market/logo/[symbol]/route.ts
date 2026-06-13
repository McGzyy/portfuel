import { NextResponse } from "next/server";
import type { AssetClass } from "@/lib/market/validate-symbol";
import { resolveSymbolLogoUrl } from "@/lib/market/symbol-logo";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await context.params;
    const { searchParams } = new URL(request.url);
    const assetClass = searchParams.get("assetClass") as AssetClass | null;

    const url = await resolveSymbolLogoUrl(
      symbol,
      assetClass === "crypto" || assetClass === "equity" ? assetClass : undefined
    );

    if (!url) {
      return NextResponse.json({ error: "logo_unavailable" }, { status: 404 });
    }

    return NextResponse.redirect(url, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (e) {
    console.error("[market/logo]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
