/** Symbols blocked for crypto calls (memecoins / noise). Extend as needed. */
export const CRYPTO_MEMECOIN_BLOCKLIST = new Set(
  [
    "PEPE",
    "SHIB",
    "BONK",
    "FLOKI",
    "WIF",
    "DOGE",
    "MEME",
    "BRETT",
    "POPCAT",
    "MOG",
    "NEIRO",
    "TURBO",
    "LADYS",
    "WOJAK",
    "BOME",
    "MEW",
    "PONKE",
    "SLERF",
    "MICHI",
    "GIGA",
  ].map((s) => s.toUpperCase())
);
