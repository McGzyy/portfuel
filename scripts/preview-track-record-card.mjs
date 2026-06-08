import { writeFileSync } from "node:fs";
import { renderTrackRecordCardPng } from "../src/lib/charts/track-record-card-render.ts";

const adminPayload = {
  username: "admin",
  displayName: "PortFuel Admin",
  callCount: 1,
  winners: 1,
  losers: 0,
  winRatePct: 100,
  avgReturnPct: 2.7,
  bestReturnPct: 2.7,
  rankScore: 3,
  trusted: true,
  highlights: [
    {
      symbol: "SOL",
      direction: "long",
      returnPct: 2.7,
      calledAt: "2026-06-08T12:00:00.000Z",
    },
  ],
  equityCurve: [0, 2.7],
  profileUrl: "https://portfuel.pro/member/admin",
  siteHost: "portfuel.pro",
};

const multiPayload = {
  ...adminPayload,
  username: "trader",
  displayName: "Alpha Trader",
  callCount: 8,
  winners: 6,
  losers: 2,
  winRatePct: 75,
  avgReturnPct: 14.2,
  bestReturnPct: 42.5,
  rankScore: 12,
  highlights: [
    { symbol: "NVDA", direction: "long", returnPct: 42.5, calledAt: "2026-05-01T12:00:00.000Z" },
    { symbol: "SOL", direction: "long", returnPct: 28.3, calledAt: "2026-05-15T12:00:00.000Z" },
    { symbol: "TSLA", direction: "short", returnPct: 18.1, calledAt: "2026-05-22T12:00:00.000Z" },
  ],
  equityCurve: [0, 8.2, 12.5, 9.1, 22.4, 31.8, 28.2, 35.6, 42.1],
};

const losingPayload = {
  ...multiPayload,
  username: "bear",
  displayName: "Bear Market",
  winners: 2,
  losers: 6,
  winRatePct: 25,
  avgReturnPct: -8.4,
  bestReturnPct: 12.1,
  rankScore: 842,
  highlights: [
    { symbol: "COIN", direction: "long", returnPct: -22.5, calledAt: "2026-05-03T12:00:00.000Z" },
    { symbol: "RIVN", direction: "long", returnPct: -15.8, calledAt: "2026-05-11T12:00:00.000Z" },
    { symbol: "ARKK", direction: "short", returnPct: 12.1, calledAt: "2026-05-19T12:00:00.000Z" },
  ],
  equityCurve: [0, -4.2, -9.8, -6.1, -14.5, -11.2, -18.6, -15.3, -22.4],
};

for (const [name, payload] of [
  ["admin", adminPayload],
  ["multi", multiPayload],
  ["losing", losingPayload],
]) {
  const png = await renderTrackRecordCardPng(payload);
  const file = `track-record-preview-${name}.png`;
  writeFileSync(file, png);
  console.log("wrote", file, png.length, "bytes");
}
