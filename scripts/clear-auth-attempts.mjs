/**
 * Clear login rate-limit rows for a username (default: admin).
 *
 *   node --env-file=.env.local scripts/clear-auth-attempts.mjs
 *   node --env-file=.env.local scripts/clear-auth-attempts.mjs other_user
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.argv[2] ?? process.env.ADMIN_USERNAME ?? "admin").toLowerCase();

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key);
const { error, count } = await db
  .from("auth_attempts")
  .delete({ count: "exact" })
  .eq("username", username);

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Cleared ${count ?? 0} auth_attempt row(s) for @${username}.`);
