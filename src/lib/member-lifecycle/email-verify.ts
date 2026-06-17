import { createServiceClient } from "@/lib/db/supabase";
import { sendPortfuelEmail } from "@/lib/email/client";
import { getAppUrl } from "@/lib/email/config";
import { generateToken, hashToken, normalizeEmail } from "@/lib/member-lifecycle/tokens";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type EmailVerifyStatus = {
  email: string | null;
  emailVerified: boolean;
  stripeCheckoutEmail: string | null;
  mismatch: boolean;
};

export async function getEmailVerifyStatus(userId: string): Promise<EmailVerifyStatus | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("email, email_verified_at, stripe_checkout_email")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  const email = (data.email as string | null)?.trim() || null;
  const stripe = (data.stripe_checkout_email as string | null)?.trim() || null;
  const verified = Boolean(data.email_verified_at);

  const mismatch =
    !verified &&
    Boolean(email && stripe) &&
    normalizeEmail(email!) !== normalizeEmail(stripe!);

  return {
    email,
    emailVerified: verified,
    stripeCheckoutEmail: stripe,
    mismatch,
  };
}

export async function isEmailTakenByOther(
  email: string,
  excludeUserId: string
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("id")
    .ilike("email", normalized)
    .not("email_verified_at", "is", null)
    .neq("id", excludeUserId)
    .maybeSingle();

  return Boolean(data);
}

export async function isEmailAvailableForSignup(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("id")
    .ilike("email", normalized)
    .not("email_verified_at", "is", null)
    .maybeSingle();

  return !data;
}

function buildVerificationEmailContent(link: string) {
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111">
  <p style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#E31B23;margin:0 0 12px">PortFuel</p>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Confirm your email to unlock the workspace</h1>
  <p style="font-size:15px;line-height:1.5;color:#525252;margin:0 0 20px">
    Payment is complete. Tap the button below once to open your member dashboard. We strongly recommend enabling 2FA after you sign in.
  </p>
  <p style="margin:0 0 24px">
    <a href="${link}" style="display:inline-block;background:#E31B23;color:#fff;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px">Unlock my workspace</a>
  </p>
  <p style="font-size:12px;color:#737373;margin:0">Link expires in 24 hours. If you didn&apos;t join PortFuel, ignore this message.</p>
</div>`;

  const text = `Confirm your email to unlock the PortFuel workspace.

Payment is complete. Open this link once to unlock your workspace. We strongly recommend enabling 2FA after sign-in:

${link}

Expires in 24 hours.`;

  return { html, text };
}

export async function setUserEmailPending(userId: string, email: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db
    .from("users")
    .update({
      email: normalizeEmail(email),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function setStripeCheckoutEmail(
  userId: string,
  email: string | null
): Promise<void> {
  if (!email?.trim()) return;
  const db = createServiceClient();
  await db
    .from("users")
    .update({
      stripe_checkout_email: normalizeEmail(email),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function chooseEmailForVerification(
  userId: string,
  source: "stripe" | "entered"
): Promise<string> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("email, stripe_checkout_email")
    .eq("id", userId)
    .maybeSingle();

  if (!data) throw new Error("user_not_found");

  const entered = (data.email as string | null)?.trim() || "";
  const stripe = (data.stripe_checkout_email as string | null)?.trim() || "";
  const chosen = source === "stripe" ? stripe : entered;
  if (!chosen) throw new Error("email_missing");

  await setUserEmailPending(userId, chosen);
  return chosen;
}

export async function sendVerificationEmail(
  userId: string,
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "invalid_email" };
  }

  if (await isEmailTakenByOther(normalized, userId)) {
    return { ok: false, error: "email_taken" };
  }

  await setUserEmailPending(userId, normalized);

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const db = createServiceClient();
  await db.from("email_verification_tokens").delete().eq("user_id", userId);
  const { error: insertErr } = await db.from("email_verification_tokens").insert({
    user_id: userId,
    email: normalized,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertErr) {
    console.error("[email-verify/send]", insertErr);
    return { ok: false, error: "token_failed" };
  }

  const appUrl = getAppUrl();
  const link = `${appUrl}/verify-email/confirm?token=${encodeURIComponent(token)}`;

  const content = buildVerificationEmailContent(link);
  const sent = await sendPortfuelEmail({
    to: normalized,
    subject: "Unlock your PortFuel workspace — confirm email",
    html: content.html,
    text: content.text,
  });

  if (!sent) return { ok: false, error: "send_failed" };
  return { ok: true };
}

export async function sendPostPaymentVerificationEmail(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const status = await getEmailVerifyStatus(userId);
  if (!status || status.emailVerified) return { ok: true };

  const email =
    status.email?.trim() ||
    status.stripeCheckoutEmail?.trim() ||
    "";
  if (!email) return { ok: false, error: "email_missing" };

  return sendVerificationEmail(userId, email);
}

export async function confirmVerificationToken(
  token: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const tokenHash = hashToken(token.trim());
  const db = createServiceClient();

  const { data: row } = await db
    .from("email_verification_tokens")
    .select("id, user_id, email, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!row) return { ok: false, error: "invalid_token" };
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  const userId = row.user_id as string;
  const email = row.email as string;

  if (await isEmailTakenByOther(email, userId)) {
    return { ok: false, error: "email_taken" };
  }

  const now = new Date().toISOString();
  const { error: updErr } = await db
    .from("users")
    .update({
      email,
      email_verified_at: now,
      notify_email: email,
      updated_at: now,
    })
    .eq("id", userId);

  if (updErr) {
    if (updErr.code === "23505") return { ok: false, error: "email_taken" };
    return { ok: false, error: "update_failed" };
  }

  await db.from("email_verification_tokens").delete().eq("user_id", userId);

  return { ok: true, userId };
}
