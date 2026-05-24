import { createServiceClient } from "@/lib/db/supabase";
import { hashIp } from "@/lib/auth/crypto";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function checkRateLimit(pin: string, ip: string): Promise<boolean> {
  const db = createServiceClient();
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error } = await db
    .from("auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq("pin", pin)
    .eq("ip_hash", ipHash)
    .eq("success", false)
    .gte("created_at", since);

  if (error) return true;
  return (count ?? 0) < MAX_ATTEMPTS;
}

export async function recordAuthAttempt(
  pin: string,
  ip: string,
  success: boolean
): Promise<void> {
  const db = createServiceClient();
  await db.from("auth_attempts").insert({
    pin,
    ip_hash: hashIp(ip),
    success,
  } as never);
}
