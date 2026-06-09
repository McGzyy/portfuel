import test from "node:test";
import assert from "node:assert/strict";
import {
  creditReturnPct,
  isCallWin,
  updatePeakReturn,
  showPeakedLabel,
  WIN_CREDIT_RETURN_PCT,
} from "../src/lib/scoring/call-credit";

test("updatePeakReturn — tracks high water mark", () => {
  assert.equal(updatePeakReturn(null, 12), 12);
  assert.equal(updatePeakReturn(20, 15), 20);
  assert.equal(updatePeakReturn(20, 25), 25);
});

test("creditReturnPct — open call uses peak floor", () => {
  assert.equal(creditReturnPct({ return_pct: 5, peak_return_pct: 30 }), 15);
  assert.equal(creditReturnPct({ return_pct: -2, peak_return_pct: 24 }), 12);
});

test("creditReturnPct — closed call locks live return", () => {
  assert.equal(
    creditReturnPct({
      return_pct: 8,
      peak_return_pct: 32,
      closed_at: new Date().toISOString(),
    }),
    8
  );
});

test("isCallWin — peak credit avoids round-trip loss", () => {
  assert.equal(isCallWin({ return_pct: 3, peak_return_pct: 18 }), true);
  assert.equal(isCallWin({ return_pct: -4, peak_return_pct: 8 }), false);
  assert.equal(
    isCallWin({ return_pct: 5, peak_return_pct: 12, target_progress: 100 }),
    true
  );
  assert.equal(
    isCallWin({
      return_pct: 6,
      peak_return_pct: 20,
      closed_at: new Date().toISOString(),
    }),
    true
  );
});

test("showPeakedLabel — only when meaningfully above live", () => {
  assert.equal(showPeakedLabel({ return_pct: 8, peak_return_pct: 22 }), true);
  assert.equal(showPeakedLabel({ return_pct: 10, peak_return_pct: 10.02 }), false);
});

test("WIN_CREDIT_RETURN_PCT is 10", () => {
  assert.equal(WIN_CREDIT_RETURN_PCT, 10);
});
