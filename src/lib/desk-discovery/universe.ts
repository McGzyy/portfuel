import { listCoreCryptoDiscoverySymbols } from "@/lib/market/crypto-allowlist";

/** Liquid US equities — static lite universe (~S&P 500 subset). */
export const DISCOVERY_EQUITY_UNIVERSE: readonly string[] = [
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "UNH",
  "JPM", "V", "XOM", "JNJ", "WMT", "MA", "PG", "HD", "CVX", "MRK",
  "ABBV", "KO", "PEP", "COST", "AVGO", "LLY", "TMO", "MCD", "CSCO", "ACN",
  "ABT", "DHR", "WFC", "BAC", "CRM", "NKE", "LIN", "AMD", "TXN", "NEE",
  "PM", "UNP", "RTX", "HON", "QCOM", "LOW", "INTU", "SPGI", "AMAT", "IBM",
  "GE", "CAT", "GS", "MS", "BLK", "SYK", "DE", "AXP", "BKNG", "MDLZ",
  "GILD", "ADI", "VRTX", "REGN", "LRCX", "ISRG", "MMC", "TJX", "CB", "CI",
  "PLD", "SO", "DUK", "ZTS", "MO", "BDX", "EOG", "SLB", "PNC", "USB",
  "CME", "NOC", "ITW", "EQIX", "CL", "APD", "SHW", "FCX", "MU", "PANW",
  "SNPS", "CDNS", "KLAC", "MRVL", "FTNT", "ORCL", "NOW", "SNOW", "CRWD", "NET",
  "DDOG", "ZS", "TEAM", "UBER", "ABNB", "SQ", "PYPL", "SHOP", "COIN", "MSTR",
  "PLTR", "SOFI", "RIVN", "LCID", "NIO", "F", "GM", "BA", "LMT", "DIS",
  "NFLX", "CMCSA", "T", "VZ", "TMUS", "CHTR", "WBD", "PARA", "SPY", "QQQ",
  "IWM", "SMH", "XLF", "XLE", "XLV", "XLI", "ARKK",
];

export function discoveryCryptoUniverse(): string[] {
  return listCoreCryptoDiscoverySymbols();
}

export function discoveryEquityBatch(offset: number, batchSize: number): {
  symbols: string[];
  nextOffset: number;
} {
  const universe = DISCOVERY_EQUITY_UNIVERSE;
  if (universe.length === 0) return { symbols: [], nextOffset: 0 };
  const start = offset % universe.length;
  const symbols: string[] = [];
  for (let i = 0; i < batchSize && i < universe.length; i++) {
    symbols.push(universe[(start + i) % universe.length]!);
  }
  const nextOffset = (start + batchSize) % universe.length;
  return { symbols, nextOffset };
}
