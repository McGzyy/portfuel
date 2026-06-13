import { createServiceClient } from "@/lib/db/supabase";
import { getCoreCryptoAsset, normalizeCryptoBase } from "@/lib/market/crypto-allowlist";
import { getCompanyProfile } from "@/lib/market/finnhub";
import type { AssetClass } from "@/lib/market/validate-symbol";

export function cryptoLogoUrl(symbol: string): string {
  const base = normalizeCryptoBase(symbol);
  return `https://assets.coincap.io/assets/icons/${base.toLowerCase()}@2x.png`;
}

export async function detectSymbolAssetClass(symbol: string): Promise<AssetClass> {
  const sym = symbol.toUpperCase();
  if (getCoreCryptoAsset(sym)) return "crypto";

  try {
    const db = createServiceClient();
    const { data } = await db
      .from("ticker_snapshots")
      .select("asset_class")
      .eq("symbol", sym)
      .maybeSingle();
    if (data?.asset_class === "crypto") return "crypto";
  } catch {
    /* optional */
  }

  return "equity";
}

export async function resolveSymbolLogoUrl(
  symbol: string,
  assetClass?: AssetClass
): Promise<string | null> {
  const sym = symbol.toUpperCase();
  const ac = assetClass ?? (await detectSymbolAssetClass(sym));

  if (ac === "crypto") {
    return cryptoLogoUrl(sym);
  }

  try {
    const profile = await getCompanyProfile(sym);
    return profile?.logo ?? null;
  } catch {
    return null;
  }
}

export async function resolveSymbolLogoUrls(
  symbols: string[],
  assetClassBySymbol?: Record<string, AssetClass>
): Promise<Record<string, string | null>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  const out: Record<string, string | null> = {};
  await Promise.all(
    unique.map(async (sym) => {
      out[sym] = await resolveSymbolLogoUrl(sym, assetClassBySymbol?.[sym]);
    })
  );
  return out;
}

export async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "image/png";
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
