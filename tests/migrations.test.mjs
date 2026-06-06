import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

test("migration filenames are unique and sorted", () => {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  assert.ok(files.length >= 40, `expected at least 40 migrations, got ${files.length}`);
  const prefixes = files.map((f) => f.split("_")[0]);
  const dupes = prefixes.filter((p, i) => prefixes.indexOf(p) !== i);
  assert.deepEqual(dupes, [], `duplicate migration timestamps: ${dupes.join(", ")}`);
});

test("journal migration chain is present", () => {
  const files = readdirSync(migrationsDir);
  const required = [
    "20260607100000_watchlist_journal.sql",
    "20260610100000_journal_entries_phase4.sql",
  ];
  for (const name of required) {
    assert.ok(files.includes(name), `missing migration ${name}`);
  }
});

test("referral migration uses non-colliding timestamp", () => {
  const files = readdirSync(migrationsDir);
  assert.ok(files.includes("20260607095000_referral_program.sql"));
  assert.ok(!files.includes("20260607100000_referral_program.sql"));
});
