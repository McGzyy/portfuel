import assert from "node:assert/strict";
import {
  buildDeskPortfolioCurve,
  computeDeskBasketReturn,
} from "../src/lib/charts/desk-portfolio-curve";

assert.equal(
  computeDeskBasketReturn([
    {
      symbol: "SOL",
      opened_at: "2026-01-01T00:00:00Z",
      return_pct: 12,
      status: "open",
      entry_price: 66,
      direction: "long",
      asset_class: "crypto",
      closed_at: null,
      last_price: 74,
    },
    {
      symbol: "AMAT",
      opened_at: "2026-02-01T00:00:00Z",
      return_pct: 8,
      status: "open",
      entry_price: 567,
      direction: "long",
      asset_class: "equity",
      closed_at: null,
      last_price: 617,
    },
  ]),
  10
);

const sparse = buildDeskPortfolioCurve([
  {
    symbol: "SOL",
    opened_at: "2026-01-01T00:00:00Z",
    return_pct: 12,
    status: "open",
    entry_price: null,
    direction: "long",
    asset_class: "crypto",
    closed_at: null,
    last_price: 74,
  },
]);
assert.ok(sparse.length >= 1);

console.log("desk-portfolio-curve tests ok");
