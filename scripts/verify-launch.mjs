#!/usr/bin/env node
/**
 * Pre-launch checklist — env vars, Stripe price IDs, critical migrations list.
 * Usage: node --env-file=.env.local scripts/verify-launch.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "TOTP_ENCRYPTION_KEY",
  "FINNHUB_API_KEY",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

const BILLING = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_MEMBER",
  "STRIPE_PRICE_PRO",
];

const AI = ["OPENAI_API_KEY"];

/** Recent migrations — confirm applied in Supabase SQL history. */
const CRITICAL_MIGRATIONS = [
  "20260524500000_stripe_billing.sql",
  "20260603110000_billing_interval.sql",
  "20260604130000_last_active_at.sql",
  "20260604133000_ai_draft_requests.sql",
  "20260707100000_engagement_alert_prefs.sql",
  "20260708100000_discord_post_copy.sql",
];

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
}

function env(name) {
  const v = process.env[name];
  return v && String(v).trim().length > 0 ? String(v).trim() : null;
}

function checkEnvGroup(title, keys, validators = {}) {
  console.log(`\n${title}`);
  let pass = 0;
  for (const key of keys) {
    const v = env(key);
    if (!v) {
      fail(`${key} — missing`);
      continue;
    }
    const validate = validators[key];
    if (validate && !validate(v)) {
      fail(`${key} — invalid format`);
      continue;
    }
    ok(key);
    pass += 1;
  }
  return pass === keys.length;
}

async function verifyStripePrices() {
  const secret = env("STRIPE_SECRET_KEY");
  if (!secret?.startsWith("sk_")) return;

  console.log("\nStripe price verification");
  const ids = [
    ["Member monthly", env("STRIPE_PRICE_MEMBER")],
    ["Pro monthly", env("STRIPE_PRICE_PRO")],
    ["Member annual", env("STRIPE_PRICE_MEMBER_ANNUAL")],
    ["Pro annual", env("STRIPE_PRICE_PRO_ANNUAL")],
  ].filter(([, id]) => id?.startsWith("price_"));

  for (const [label, priceId] of ids) {
    try {
      const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!res.ok) {
        fail(`${label} (${priceId}) — Stripe API ${res.status}`);
        continue;
      }
      const price = await res.json();
      const amount = price.unit_amount != null ? price.unit_amount / 100 : null;
      const interval = price.recurring?.interval ?? "one_time";
      ok(`${label}: ${amount != null ? `$${amount}` : "—"} / ${interval} (${priceId})`);
    } catch (e) {
      fail(`${label} — ${e instanceof Error ? e.message : "fetch failed"}`);
    }
  }

  const annualUi = env("NEXT_PUBLIC_ANNUAL_BILLING_ENABLED") === "true";
  const hasAnnual = ids.some(([l]) => l.includes("annual"));
  if (annualUi && !hasAnnual) {
    warn("NEXT_PUBLIC_ANNUAL_BILLING_ENABLED=true but annual price IDs missing");
  }
}

function verifyPlansAlignment() {
  console.log("\nDisplay pricing (src/lib/marketing/plans.ts)");
  try {
    const plansPath = join(root, "src", "lib", "marketing", "plans.ts");
    const src = readFileSync(plansPath, "utf8");
    const member = src.match(/member:\s*\{[\s\S]*?priceAmount:\s*(\d+)/);
    const pro = src.match(/pro:\s*\{[\s\S]*?priceAmount:\s*(\d+)/);
    if (member?.[1]) ok(`Member display: $${member[1]}/mo`);
    if (pro?.[1]) ok(`Pro display: $${pro[1]}/mo`);
    warn("Confirm Stripe Dashboard prices match display amounts ($49 / $79, annual $490 / $790)");
  } catch {
    warn("Could not read plans.ts");
  }
}

function listCriticalMigrations() {
  console.log("\nCritical migrations (apply in Supabase if not already)");
  const dir = join(root, "supabase", "migrations");
  for (const file of CRITICAL_MIGRATIONS) {
    const path = join(dir, file);
    if (existsSync(path)) {
      ok(file);
    } else {
      fail(`${file} — not found locally`);
    }
  }
  const total = readdirSync(dir).filter((f) => f.endsWith(".sql")).length;
  console.log(`\n  Total local migrations: ${total} — run all via Supabase CLI or SQL editor.`);
  console.log("  Tip: npm run migrations:list");
}

function verifySessionSecret() {
  const s = env("SESSION_SECRET");
  if (s && s.length < 32) {
    warn("SESSION_SECRET should be at least 32 characters");
  }
}

async function main() {
  console.log("PortFuel launch verification\n");

  const coreOk = checkEnvGroup("Core (required)", REQUIRED, {
    NEXT_PUBLIC_SUPABASE_URL: (v) => v.startsWith("https://") && !v.includes("your-project"),
    SESSION_SECRET: (v) => v.length >= 16,
  });

  const billingOk = checkEnvGroup("Billing (required for paid launch)", BILLING, {
    STRIPE_SECRET_KEY: (v) => v.startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET: (v) => v.startsWith("whsec_"),
    STRIPE_PRICE_MEMBER: (v) => v.startsWith("price_"),
    STRIPE_PRICE_PRO: (v) => v.startsWith("price_"),
  });

  checkEnvGroup("AI features (recommended)", AI, {
    OPENAI_API_KEY: (v) => v.startsWith("sk-"),
  });

  verifySessionSecret();
  verifyPlansAlignment();
  listCriticalMigrations();
  await verifyStripePrices();

  console.log("\nFunnel smoke test (manual)");
  console.log("  1. / → hero → /demo → toggle Member/Pro");
  console.log("  2. /join → plan → checkout (test mode)");
  console.log("  3. Login → /dashboard → publish call");

  const ready = coreOk && billingOk;
  console.log(ready ? "\n✓ Core + billing env look ready." : "\n✗ Fix missing env before launch.");
  process.exit(ready ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
