/**
 * One-shot social pipeline smoke check (no test runner).
 * Run: npm run smoke:social
 */
process.env.NEXT_PUBLIC_DEMO_MODE = "true";
process.env.X_API_ENABLED = "false";
process.env.X_API_DRY_RUN = "true";

import { callMilestoneKeysForCall } from "../src/lib/notifications/milestone-keys.ts";
import { loadDemoSocialChartPayload } from "../src/lib/charts/social-chart-demo.ts";
import { renderSocialChartPng } from "../src/lib/charts/social-chart-render.ts";
import { renderMarketingOgPng } from "../src/lib/charts/marketing-render.tsx";
import { loadMarketingCallContext } from "../src/lib/marketing/marketing-call-data.ts";
import { postFueledMilestone } from "../src/lib/social/x-milestone-post.ts";
import { postMemberWin } from "../src/lib/social/x-member-win-post.ts";
import { DEMO_MEMBER_WIN_CALL_ID } from "../src/lib/charts/social-chart-demo.ts";
import { composeWeeklyDigestPost, fetchWeeklyDigestRows } from "../src/lib/social/weekly-digest.ts";
import { postWeeklyDigest } from "../src/lib/social/x-weekly-digest-post.ts";
import { loadTrackRecordCardPayload } from "../src/lib/charts/track-record-card-data.ts";
import { renderTrackRecordCardPng } from "../src/lib/charts/track-record-card-render.ts";

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
}

function fail(name: string, detail: string) {
  checks.push({ name, ok: false, detail });
}

try {
  const keys = callMilestoneKeysForCall({
    return_pct: 12,
    target_progress: null,
    entry_price: 100,
    target_price: 120,
  });
  keys.length === 1 && keys[0] === "return_10"
    ? pass("milestone keys", keys.join(", "))
    : fail("milestone keys", JSON.stringify(keys));
} catch (e) {
  fail("milestone keys", String(e));
}

try {
  const payload = await loadDemoSocialChartPayload("return_10");
  const png = await renderSocialChartPng(payload);
  png.length > 8_000
    ? pass("social chart PNG", `${(png.length / 1024).toFixed(1)} KB`)
    : fail("social chart PNG", `only ${png.length} bytes`);
} catch (e) {
  fail("social chart PNG", String(e));
}

try {
  const ctx = await loadMarketingCallContext();
  const png = await renderMarketingOgPng("proof", ctx);
  png.length > 5_000
    ? pass("marketing OG proof", `${ctx.topMember.symbol} · ${(png.length / 1024).toFixed(1)} KB`)
    : fail("marketing OG proof", `only ${png.length} bytes`);
} catch (e) {
  fail("marketing OG proof", String(e));
}

try {
  const result = await postFueledMilestone({
    callId: "demo-call-001",
    milestone: "return_10",
    dryRun: true,
  });
  result.ok && result.chartGenerated
    ? pass("milestone dry-run post", `${result.text.length} chars · chart ${result.chartSizeBytes}b`)
    : fail("milestone dry-run post", result.ok ? "no chart" : (result as { error: string }).error);
} catch (e) {
  fail("milestone dry-run post", String(e));
}

try {
  const member = await postMemberWin({
    callId: DEMO_MEMBER_WIN_CALL_ID,
    dryRun: true,
    skipReadiness: true,
  });
  member.ok && member.chartGenerated
    ? pass("member win dry-run", `${member.text.length} chars · chart ${member.chartSizeBytes}b`)
    : fail("member win dry-run", member.ok ? "no chart" : (member as { error: string }).error);
} catch (e) {
  fail("member win dry-run", String(e));
}

try {
  const rows = await fetchWeeklyDigestRows(3);
  const composed = await composeWeeklyDigestPost(rows);
  const posted =
    composed.ok ? await postWeeklyDigest({ dryRun: true }) : { ok: false as const, error: "no_content" };
  posted.ok && posted.chartGenerated
    ? pass("weekly digest dry-run", `${rows.length} rows · chart ${posted.chartSizeBytes}b`)
    : fail(
        "weekly digest dry-run",
        posted.ok ? "no chart" : composed.ok ? posted.error : "compose failed"
      );
} catch (e) {
  fail("weekly digest dry-run", String(e));
}

try {
  const loaded = await loadTrackRecordCardPayload("ace_calls");
  if (!("payload" in loaded)) {
    fail("track record card", "demo member not found");
  } else {
    const png = await renderTrackRecordCardPng(loaded.payload);
    png.length > 8_000
      ? pass("track record card", `@${loaded.payload.username} · ${(png.length / 1024).toFixed(1)} KB`)
      : fail("track record card", `only ${png.length} bytes`);
  }
} catch (e) {
  fail("track record card", String(e));
}

console.log("\nPortFuel social smoke\n");
for (const c of checks) {
  console.log(c.ok ? "  ✓" : "  ✗", c.name, c.detail ? `— ${c.detail}` : "");
}
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} passed\n`);
process.exit(failed.length > 0 ? 1 : 0);
