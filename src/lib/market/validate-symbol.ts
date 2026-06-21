import { getCryptoLastPrice, getQuote } from "@/lib/market/finnhub";
import { resolveEquityLastPrice, resolveQuotePrice } from "@/lib/market/equity-quote";
import { getCoreCryptoAsset, resolveCryptoAsset } from "@/lib/market/crypto-allowlist";

export type AssetClass = "equity" | "crypto";

export type SymbolValidation =
  | {
      ok: true;
      assetClass: AssetClass;
      symbol: string;
      finnhubSymbol?: string;
      name?: string;
      /** Latest market price when available (for call entry helper). */
      lastPrice?: number;
    }
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
    const lastPrice = await getCryptoLastPrice(asset.finnhub_symbol);
    return {
      ok: true,
      assetClass: "crypto",
      symbol: asset.symbol,
      finnhubSymbol: asset.finnhub_symbol,
      name: asset.display_name ?? asset.symbol,
      lastPrice: lastPrice ?? undefined,
    };
  }

  const quote = await getQuote(sym, { fresh: true });
  const price =
    (await resolveEquityLastPrice(sym)) ?? resolveQuotePrice(quote) ?? quote?.c;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Unknown stock ticker. Check the symbol (e.g. AAPL, NVDA)." };
  }

  return { ok: true, assetClass: "equity", symbol: sym, lastPrice: price };
}

/** Resolve a symbol for watchlist add — crypto majors first, then equities. */
export async function resolveWatchlistSymbol(symbol: string): Promise<SymbolValidation> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return { ok: false, error: "Symbol required" };

  const cryptoAsset = await resolveCryptoAsset(sym);
  if (cryptoAsset) {
    const lastPrice = await getCryptoLastPrice(cryptoAsset.finnhub_symbol);
    return {
      ok: true,
      assetClass: "crypto",
      symbol: cryptoAsset.symbol,
      finnhubSymbol: cryptoAsset.finnhub_symbol,
      name: cryptoAsset.display_name ?? cryptoAsset.symbol,
      lastPrice: lastPrice ?? undefined,
    };
  }

  // Avoid matching obscure equity tickers (e.g. OTC "SOL") when user meant Solana.
  if (getCoreCryptoAsset(sym)) {
    return {
      ok: false,
      error:
        "Could not verify crypto price right now. Try again in a moment or pick Crypto in symbol lookup.",
    };
  }

  return validateSymbol(sym, "equity");
}
