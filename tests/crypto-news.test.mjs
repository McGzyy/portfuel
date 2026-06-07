import assert from "node:assert/strict";
import test from "node:test";

/** Mirror filterCryptoNewsForSymbol for headline tagging contracts. */
function filterCryptoNewsForSymbol(items, baseSymbol) {
  const sym = baseSymbol.toUpperCase();
  return items
    .filter((item) => {
      const related = item.related?.toUpperCase() ?? "";
      if (!related) return false;
      return related.split(",").some((token) => token.trim() === sym);
    })
    .slice(0, 20)
    .map(({ related: _related, ...item }) => item);
}

test("filterCryptoNewsForSymbol matches related tickers", () => {
  const items = [
    {
      id: 1,
      category: "crypto",
      datetime: 1,
      headline: "BTC rally",
      source: "CoinDesk",
      summary: "",
      url: "https://example.com/1",
      related: "BTC,ETH",
    },
    {
      id: 2,
      category: "crypto",
      datetime: 2,
      headline: "ETH only",
      source: "CoinDesk",
      summary: "",
      url: "https://example.com/2",
      related: "ETH",
    },
    {
      id: 3,
      category: "crypto",
      datetime: 3,
      headline: "Macro",
      source: "Reuters",
      summary: "",
      url: "https://example.com/3",
    },
  ];

  const btc = filterCryptoNewsForSymbol(items, "btc");
  assert.equal(btc.length, 1);
  assert.equal(btc[0].headline, "BTC rally");
  assert.equal(btc[0].related, undefined);

  const eth = filterCryptoNewsForSymbol(items, "ETH");
  assert.equal(eth.length, 2);
});
