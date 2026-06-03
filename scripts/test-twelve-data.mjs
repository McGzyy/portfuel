/**
 * Usage: node --env-file=.env.local scripts/test-twelve-data.mjs [SYMBOL]
 */
const symbol = (process.argv[2] ?? "PURR").trim().toUpperCase();
const apikey = process.env.TWELVEDATA_API_KEY?.trim();
if (!apikey) {
  console.error("TWELVEDATA_API_KEY not set");
  process.exit(1);
}

const to = new Date().toISOString().slice(0, 10);
const from = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
const url = `https://api.twelvedata.com/time_series?${new URLSearchParams({
  symbol,
  interval: "1day",
  start_date: from,
  end_date: to,
  apikey,
  order: "ASC",
})}`;

const res = await fetch(url);
const json = await res.json();
if (json.status === "error") {
  console.error("FAIL:", json.message ?? json);
  process.exit(1);
}
console.log("OK bars:", json.values?.length ?? 0);
console.log("first:", json.values?.[0]);
console.log("last:", json.values?.at(-1));
