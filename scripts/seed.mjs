/**
 * Seed admin user. Run after migrations:
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Set ADMIN_PIN (5 digits) and optionally ADMIN_TOTP_SECRET in env.
 * If no secret, prints one to enroll in your authenticator.
 */
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createHash, randomBytes } from "crypto";
import { generateSecret, verify } from "otplib";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pin = process.env.ADMIN_PIN ?? "10000";

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function encryptSecret(plain) {
  const raw = process.env.TOTP_ENCRYPTION_KEY ?? "dev-only-change-in-production!!";
  const encKey = createHash("sha256").update(raw).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

const secret = process.env.ADMIN_TOTP_SECRET || generateSecret();
const db = createClient(url, key);

const { data: existing } = await db.from("users").select("id").eq("pin", pin).maybeSingle();
if (existing) {
  console.log(`Admin PIN ${pin} already exists.`);
  process.exit(0);
}

const { error } = await db.from("users").insert({
  pin,
  display_name: "PortFuel Admin",
  totp_secret_enc: encryptSecret(secret),
  totp_verified: true,
  role: "admin",
  subscription_status: "active",
  submission_quota_week: 99,
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Admin created. PIN: ${pin}`);
if (!process.env.ADMIN_TOTP_SECRET) {
  console.log(`TOTP secret (add to authenticator): ${secret}`);
  console.log(`Or set ADMIN_TOTP_SECRET=${secret} and re-run if you need to store it.`);
}
