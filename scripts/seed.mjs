/**
 * Seed admin user. Run after migrations:
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Env: ADMIN_USERNAME (default admin), ADMIN_PASSWORD (required),
 *      ADMIN_TOTP_SECRET (optional), TOTP_ENCRYPTION_KEY, Supabase keys.
 */
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createHash, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { generateSecret } from "otplib";

const scryptAsync = promisify(scrypt);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set ADMIN_PASSWORD (min 8 chars, letter + number) in .env.local");
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

async function hashPassword(pw) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(pw, salt, 64);
  return `${salt.toString("hex")}.${derived.toString("hex")}`;
}

async function uniquePin(db) {
  for (let i = 0; i < 30; i++) {
    const pin = String(Math.floor(10000 + Math.random() * 90000));
    const { data } = await db.from("users").select("id").eq("pin", pin).maybeSingle();
    if (!data) return pin;
  }
  throw new Error("Could not allocate pin");
}

const secret = process.env.ADMIN_TOTP_SECRET || generateSecret();
const db = createClient(url, key);

const { data: existing } = await db
  .from("users")
  .select("id, username")
  .eq("username", username)
  .maybeSingle();

if (existing) {
  console.log(`Admin @${username} already exists. Use scripts/set-admin-password.mjs to rotate password.`);
  process.exit(0);
}

const pin = await uniquePin(db);
const passwordHash = await hashPassword(password);

const { error } = await db.from("users").insert({
  pin,
  username,
  password_hash: passwordHash,
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

console.log(`Admin created. Username: ${username}`);
console.log(`Sign in at /login with username + password + authenticator code.`);
if (!process.env.ADMIN_TOTP_SECRET) {
  console.log(`TOTP secret (add to authenticator): ${secret}`);
  console.log(`Or set ADMIN_TOTP_SECRET=${secret} and re-run if you need to store it.`);
}
