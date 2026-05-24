import { getQuote } from "@/lib/market/finnhub";
import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";

export type AssetClass = "equity" | "crypto";

export type SymbolValidation =
  | { ok: true; assetClass: AssetClass; symbol: string; finnhubSymbol?: string; name?: string }
  | { ok: false; error: string };

export async function validateSymbol(
  symbol: string,
  assetClass: AssetClass
): Promise<SymbolValidation> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return { ok: false, error: "Symbol required" };

  if (assetClass === "crypto") {
    const asset = await resolveCryptoAsset(sym);
    if (!asset) {
      return {
        ok: false,
        error:
          "Not on the major-exchange list (Coinbase/Kraken). Memecoins and unlisted tokens are not supported.",
      };
    }
    return {
      ok: true,
      assetClass: "crypto",
      symbol: asset.symbol,
      finnhubSymbol: asset.finnhub_symbol,
      name: asset.display_name ?? asset.symbol,
    };
  }

  const quote = await getQuote(sym);
  if (!quote?.c) {
    return { ok: false, error: "Unknown stock ticker. Check the symbol (e.g. AAPL, NVDA)." };
  }

  return { ok: true, assetClass: "equity", symbol: sym };
}
