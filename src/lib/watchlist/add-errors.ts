/** User-facing errors when adding a symbol to the watchlist. */
export function watchlistAddErrorMessage(code: string | undefined): string {
  switch (code) {
    case "watchlist_full":
      return "Watchlist is full (24 max). Remove a symbol to add another.";
    case "demo_readonly":
      return "Demo mode — add symbols from the watchlist panel (browser storage).";
    case "invalid_symbol":
      return "Enter a valid ticker symbol.";
    case "unknown_symbol":
      return "Unknown stock ticker. Check the symbol (e.g. AAPL, NVDA).";
    case "crypto_not_supported":
      return "That crypto is not on the major-exchange list (Coinbase/Kraken).";
    case "db_error":
      return "Could not save — try again in a moment.";
    default:
      return "Could not add symbol.";
  }
}
