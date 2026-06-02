import { createServiceClient } from "@/lib/db/supabase";
import { hashPassword } from "@/lib/auth/password";
import { sendPortfuelEmail } from "@/lib/email/client";
import { getAppUrl } from "@/lib/email/config";
import { generateToken, hashToken } from "@/lib/member-lifecycle/tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(email: string): Promise<void> {
  const db = createServiceClient();
  const normalized = email.trim().toLowerCase();

  const { data: user } = await db
    .from("users")
    .select("id, email_verified_at")
    .eq("email", normalized)
    .not("email_verified_at", "is", null)
    .maybeSingle();

  if (!user) return;

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await db.from("password_reset_tokens").delete().eq("user_id", user.id);
  await db.from("password_reset_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const link = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPortfuelEmail({
    to: normalized,
    subject: "Reset your PortFuel password",
    html: `<p>Reset your password:</p><p><a href="${link}">Set new password</a></p><p>Expires in 1 hour. If you did not request this, ignore this email.</p>`,
    text: `Reset your password: ${link}\n\nExpires in 1 hour.`,
  });
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tokenHash = hashToken(token.trim());
  const db = createServiceClient();

  const { data: row } = await db
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!row || row.used_at) return { ok: false, error: "invalid_token" };
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  const passwordHash = await hashPassword(newPassword);
  const { error } = await db
    .from("users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.user_id as string);

  if (error) return { ok: false, error: "update_failed" };

  await db
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id as string);

  return { ok: true };
}
