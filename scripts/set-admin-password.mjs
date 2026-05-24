/**
 * Set password (and optionally username) on existing admin row.
 *   node --env-file=.env.local scripts/set-admin-password.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!url || !key || !password) {
  console.error("Set Supabase keys and ADMIN_PASSWORD in .env.local");
  process.exit(1);
}

async function hashPassword(pw) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(pw, salt, 64);
  return `${salt.toString("hex")}.${derived.toString("hex")}`;
}

const db = createClient(url, key);
const passwordHash = await hashPassword(password);

const { data: adminByRole } = await db.from("users").select("id, username").eq("role", "admin").limit(1);
const target = adminByRole?.[0];

if (!target) {
  const { data: byName } = await db.from("users").select("id").eq("username", username).maybeSingle();
  if (!byName) {
    console.error("No admin user found. Run scripts/seed.mjs first.");
    process.exit(1);
  }
  const { error } = await db
    .from("users")
    .update({ password_hash: passwordHash, username })
    .eq("id", byName.id);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Updated @${username} password.`);
  process.exit(0);
}

const { error } = await db
  .from("users")
  .update({ password_hash: passwordHash, username })
  .eq("id", target.id);

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Updated admin @${username} password.`);
