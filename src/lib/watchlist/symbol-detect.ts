import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";

export async function detectAssetClassForSymbol(
  symbol: string
): Promise<"equity" | "crypto"> {
  const crypto = await resolveCryptoAsset(symbol);
  return crypto ? "crypto" : "equity";
}
