/**
 * Smoke tests for X social pipeline, chart PNG renders, and marketing assets.
 * Run: npm run test:social
 */
import test from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_DEMO_MODE = "true";
process.env.X_API_ENABLED = "false";
process.env.X_API_DRY_RUN = "true";
delete process.env.X_AUTOPOST_MILESTONES;
delete process.env.X_AUTOPOST_FUELED_ON_PUBLISH;

import { callMilestoneKeysForCall } from "../src/lib/notifications/milestone-keys";
import { getXConfig } from "../src/lib/social/x-config";
import { formatPostError } from "../src/lib/social/format-post-error";
import { loadDemoSocialChartPayload } from "../src/lib/charts/social-chart-demo";
import { renderSocialChartPng } from "../src/lib/charts/social-chart-render";
import { renderMarketingOgPng } from "../src/lib/charts/marketing-render";
import { loadMarketingCallContext, loadMarketingSpotlight } from "../src/lib/marketing/marketing-call-data";
import { composeFueledPostByCallId } from "../src/lib/social/x-compose";
import { postFueledMilestone } from "../src/lib/social/x-milestone-post";
import { tryAutopostFueledOnPublish } from "../src/lib/social/x-fueled-autopost";
import { postMemberWin } from "../src/lib/social/x-member-win-post";
import { fetchMemberWinCandidates } from "../src/lib/social/member-win-scan";
import { DEMO_MEMBER_WIN_CALL_ID } from "../src/lib/charts/social-chart-demo";
import { composeWeeklyDigestPost, fetchWeeklyDigestRows } from "../src/lib/social/weekly-digest";
import { postWeeklyDigest } from "../src/lib/social/x-weekly-digest-post";
import { renderWeeklyDigestOgPng } from "../src/lib/charts/weekly-digest-og";
import { loadTrackRecordCardPayload } from "../src/lib/charts/track-record-card-data";
import { renderTrackRecordCardPng } from "../src/lib/charts/track-record-card-render";

test("callMilestoneKeysForCall — return thresholds", () => {
  assert.deepEqual(callMilestoneKeysForCall({ return_pct: 5, target_progress: null }), []);
  assert.deepEqual(callMilestoneKeysForCall({ return_pct: 12, target_progress: null }), [
    "return_10",
  ]);
  assert.deepEqual(callMilestoneKeysForCall({ return_pct: 30, target_progress: null }), [
    "return_10",
    "return_25",
  ]);
});

test("callMilestoneKeysForCall — target requires entry and target prices", () => {
  assert.deepEqual(
    callMilestoneKeysForCall({
      return_pct: 8,
      target_progress: 100,
    }),
    []
  );
  assert.deepEqual(
    callMilestoneKeysForCall({
      return_pct: 8,
      target_progress: 100,
      entry_price: 100,
      target_price: 120,
    }),
    ["target_reached"]
  );
});

test("x-config — safe defaults for staging", () => {
  const c = getXConfig();
  assert.equal(c.enabled, false);
  assert.equal(c.dryRun, true);
  assert.equal(c.autopostMilestones, false);
  assert.equal(c.autopostFueledOnPublish, false);
});

test("formatPostError — known admin errors", () => {
  assert.match(formatPostError("already_posted"), /Already published/i);
  assert.match(formatPostError("call_id_and_milestone_required"), /Call ID and milestone/i);
  assert.match(formatPostError("http_403"), /X API error/i);
});

test("social chart PNG — demo milestone render", async () => {
  const payload = await loadDemoSocialChartPayload("return_25");
  assert.equal(payload.symbol, "NVDA");
  const png = await renderSocialChartPng(payload);
  assert.ok(png.length > 8_000, `expected PNG > 8KB, got ${png.length}`);
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
});

test("marketing OG PNG — proof variant in demo mode", async () => {
  const ctx = await loadMarketingCallContext();
  assert.ok(ctx.topMember.symbol.length >= 1);
  const png = await renderMarketingOgPng("proof", ctx);
  assert.ok(png.length > 5_000, `expected OG PNG > 5KB, got ${png.length}`);
});

test("marketing spotlight — demo source", async () => {
  const spotlight = await loadMarketingSpotlight();
  assert.equal(spotlight.source, "demo");
  assert.ok(spotlight.entries.topMember.usedIn.includes("og/proof"));
  assert.ok(spotlight.rankings.length >= 1);
});

test("compose Fueled post — demo call", async () => {
  const composed = await composeFueledPostByCallId("demo-call-001");
  assert.equal(composed.ok, true);
  if (!composed.ok) return;
  assert.ok(composed.text.length > 20 && composed.text.length <= 280);
  assert.match(composed.text, /NVDA/i);
});

test("postFueledMilestone — dry-run with demo call and chart", async () => {
  const result = await postFueledMilestone({
    callId: "demo-call-001",
    milestone: "return_10",
    dryRun: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.dryRun, true);
  assert.equal(result.chartGenerated, true);
  assert.ok((result.chartSizeBytes ?? 0) > 8_000);
  assert.ok(result.text.length <= 280);
});

test("tryAutopostFueledOnPublish — no-op when disabled", async () => {
  await assert.doesNotReject(async () => {
    await tryAutopostFueledOnPublish("demo-call-001");
  });
});

test("fetchMemberWinCandidates — demo queue for admin", async () => {
  const candidates = await fetchMemberWinCandidates(5);
  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0]?.callId, DEMO_MEMBER_WIN_CALL_ID);
  assert.equal(candidates[0]?.status, "ready");
});

test("postMemberWin — dry-run with demo member call and chart", async () => {
  const result = await postMemberWin({
    callId: DEMO_MEMBER_WIN_CALL_ID,
    dryRun: true,
    skipReadiness: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.dryRun, true);
  assert.equal(result.chartGenerated, true);
  assert.ok((result.chartSizeBytes ?? 0) > 8_000);
  assert.ok(result.text.length <= 280);
});

test("weekly digest — demo rows, compose, chart PNG, dry-run post", async () => {
  const rows = await fetchWeeklyDigestRows(3);
  assert.ok(rows.length >= 1);

  const composed = await composeWeeklyDigestPost(rows);
  assert.equal(composed.ok, true);
  if (!composed.ok) return;
  assert.ok(composed.text.length <= 280);

  const chartPng = await renderWeeklyDigestOgPng(composed.rows);
  assert.ok(chartPng.length > 5_000, `expected digest PNG > 5KB, got ${chartPng.length}`);

  const posted = await postWeeklyDigest({ dryRun: true });
  assert.equal(posted.ok, true);
  if (!posted.ok) return;
  assert.equal(posted.dryRun, true);
  assert.equal(posted.chartGenerated, true);
});

test("track record share card — demo member PNG", async () => {
  const loaded = await loadTrackRecordCardPayload("ace_calls");
  assert.equal("payload" in loaded, true);
  if (!("payload" in loaded)) return;

  const png = await renderTrackRecordCardPng(loaded.payload);
  assert.ok(png.length > 8_000, `expected track record PNG > 8KB, got ${png.length}`);
  assert.equal(png[0], 0x89);
  assert.match(loaded.payload.username, /ace_calls/i);
});
