import assert from "node:assert/strict";
import { mergeDiscoveryHits } from "../src/lib/desk-discovery/scoring";
import {
  earningsIntensityWeight,
  volumeAnomalyWeight,
} from "../src/lib/desk-discovery/signal-intensity";

assert.ok(earningsIntensityWeight(2) > earningsIntensityWeight(14));
assert.ok(volumeAnomalyWeight(3.5, 0.05) > volumeAnomalyWeight(2.1, 0.04));

const earningsOnly = mergeDiscoveryHits([
  {
    symbol: "AMAT",
    assetClass: "equity",
    type: "earnings_soon",
    detail: "Earnings in 14d",
    weight: earningsIntensityWeight(14),
  },
]);
assert.equal(earningsOnly.length, 0, "weak far-out earnings alone should fail minScore");

const strongEarnings = mergeDiscoveryHits([
  {
    symbol: "AMAT",
    assetClass: "equity",
    type: "earnings_soon",
    detail: "Earnings in 3d",
    weight: earningsIntensityWeight(3),
  },
]);
assert.equal(strongEarnings.length, 1);
assert.ok(strongEarnings[0]!.score >= 32);

const confluence = mergeDiscoveryHits([
  {
    symbol: "NVDA",
    assetClass: "equity",
    type: "earnings_soon",
    detail: "Earnings in 4d",
    weight: earningsIntensityWeight(4),
  },
  {
    symbol: "NVDA",
    assetClass: "equity",
    type: "news_catalyst",
    detail: "Guidance raise headline",
    weight: 28,
  },
  {
    symbol: "NVDA",
    assetClass: "equity",
    type: "volume_anomaly",
    detail: "Volume 3.2× avg",
    weight: 38,
  },
]);
assert.equal(confluence.length, 1);
assert.ok(
  confluence[0]!.score >= 80,
  `expected high confluence score, got ${confluence[0]!.score}`
);

console.log("discovery-scoring tests ok");
