#!/usr/bin/env node
/** Lists Supabase migrations in apply order. */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log(`Found ${files.length} migrations in supabase/migrations/\n`);
for (const f of files) {
  console.log(f);
}
