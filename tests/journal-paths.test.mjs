import test from "node:test";
import assert from "node:assert/strict";

/** Mirror journalSymbolPath query building for alert href contracts. */
function journalAlertHref(symbol, kind) {
  const sym = symbol.toUpperCase();
  let url = `/dashboard/journal/${encodeURIComponent(sym)}`;
  const params = new URLSearchParams();
  if (kind === "earnings") params.set("entry", "earnings");
  if (kind === "price_move") params.set("entry", "price_action");
  const qs = params.toString();
  if (qs) url += `?${qs}`;
  const section = kind === "plan_level" ? "plan" : "entries";
  url += `#journal-${section}`;
  return url;
}

test("earnings alert pre-fills entry type", () => {
  assert.equal(
    journalAlertHref("nvda", "earnings"),
    "/dashboard/journal/NVDA?entry=earnings#journal-entries"
  );
});

test("price move alert pre-fills price_action", () => {
  assert.equal(
    journalAlertHref("aapl", "price_move"),
    "/dashboard/journal/AAPL?entry=price_action#journal-entries"
  );
});

test("plan level alert opens plan section", () => {
  assert.equal(journalAlertHref("tsla", "plan_level"), "/dashboard/journal/TSLA#journal-plan");
});
