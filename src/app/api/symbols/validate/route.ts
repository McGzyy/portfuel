import { NextResponse } from "next/server";
import { validateSymbol, type AssetClass } from "@/lib/market/validate-symbol";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const assetClass = (url.searchParams.get("assetClass") ?? "equity") as AssetClass;

  if (assetClass !== "equity" && assetClass !== "crypto") {
    return NextResponse.json({ error: "invalid_asset_class" }, { status: 400 });
  }

  const result = await validateSymbol(symbol, assetClass);
  return NextResponse.json(result);
}
