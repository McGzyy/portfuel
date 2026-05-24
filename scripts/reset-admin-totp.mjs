/**
 * Reset TOTP for the admin PIN in ADMIN_PIN (default 10000).
 * Prints a new secret to enroll in your authenticator.
 *
 *   node --env-file=.env.local scripts/reset-admin-totp.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createHash, randomBytes } from "crypto";
import { generateSecret, generateURI } from "otplib";

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

const secret = process.env.ADMIN_TOTP_SECRET?.trim() || generateSecret();
const db = createClient(url, key);

const { data: user, error: findErr } = await db
  .from("users")
  .select("id, role, pin")
  .eq("pin", pin)
  .maybeSingle();

if (findErr) {
  console.error(findErr);
  process.exit(1);
}

if (!user) {
  console.error(`No user with PIN ${pin}. Run: node --env-file=.env.local scripts/seed.mjs`);
  process.exit(1);
}

const { error: updateErr } = await db
  .from("users")
  .update({
    totp_secret_enc: encryptSecret(secret),
    totp_verified: true,
    role: "admin",
    subscription_status: "active",
  })
  .eq("id", user.id);

if (updateErr) {
  console.error(updateErr);
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.portfuel.pro";
const uri = generateURI({
  issuer: "PortFuel.pro",
  label: pin,
  secret,
});

console.log("");
console.log("=== Admin authenticator reset ===");
console.log(`PortFuel ID (PIN): ${pin}`);
console.log("");
console.log("Setup key (paste into Google Authenticator → Enter setup key):");
console.log(secret);
console.log("");
console.log("Optional — save in .env.local for next reset:");
console.log(`ADMIN_TOTP_SECRET=${secret}`);
console.log("");
console.log("Sign in at:", `${appUrl.replace(/\/$/, "")}/login`);
console.log("");
