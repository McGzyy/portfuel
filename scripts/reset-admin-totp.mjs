/**
 * Reset TOTP for admin user (by ADMIN_USERNAME or role=admin).
 *
 *   node --env-file=.env.local scripts/reset-admin-totp.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createHash, randomBytes } from "crypto";
import { generateSecret, generateURI } from "otplib";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();

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

let user =
  (
    await db.from("users").select("id, role, username, pin").eq("username", username).maybeSingle()
  ).data ?? null;

if (!user) {
  const { data: adminRow } = await db
    .from("users")
    .select("id, role, username, pin")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  user = adminRow;
}

if (!user) {
  console.error(`No admin user. Run: node --env-file=.env.local scripts/seed.mjs`);
  process.exit(1);
}

const { error: updateErr } = await db
  .from("users")
  .update({
    totp_secret_enc: encryptSecret(secret),
    totp_verified: true,
    role: "admin",
    subscription_status: "active",
    username,
  })
  .eq("id", user.id);

if (updateErr) {
  console.error(updateErr);
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.portfuel.pro";
const uri = generateURI({
  issuer: "PortFuel.pro",
  label: username,
  secret,
});

console.log("");
console.log("=== Admin authenticator reset ===");
console.log(`Username: @${username}`);
console.log("");
console.log("Setup key (paste into Google Authenticator → Enter setup key):");
console.log(secret);
console.log("");
console.log("Optional — save in .env.local for next reset:");
console.log(`ADMIN_TOTP_SECRET=${secret}`);
console.log("");
console.log("Sign in at:", `${appUrl.replace(/\/$/, "")}/login`);
console.log("otpauth URI:", uri);
console.log("");
