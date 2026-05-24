import type { SupabaseClient } from "@supabase/supabase-js";

/** Internal 5-digit ID for legacy columns; not used for login. */
export async function generateUniquePin(
  db: SupabaseClient
): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const pin = String(Math.floor(10000 + Math.random() * 90000));
    const { data } = await db.from("users").select("id").eq("pin", pin).maybeSingle();
    if (!data) return pin;
  }
  throw new Error("pin_generation_failed");
}
