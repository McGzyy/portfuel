import { createServiceClient } from "@/lib/db/supabase";
import { isEmailConfigured } from "@/lib/email/config";
import { sendPortfuelEmail } from "@/lib/email/client";
import { appPath } from "@/lib/social/app-url";
import {
  isReferralProgramEnabled,
  refereeDiscountLabel,
  referrerRewardLabel,
} from "@/lib/referrals/config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInviteEmails(raw: string): string[] {
  const parts = raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const unique: string[] = [];
  for (const e of parts) {
    if (!EMAIL_RE.test(e)) continue;
    if (!unique.includes(e)) unique.push(e);
  }
  return unique.slice(0, 10);
}

export async function sendReferralInvites(opts: {
  referrerId: string;
  referrerUsername: string;
  referrerDisplayName: string;
  emails: string[];
}): Promise<{ sent: number; skipped: number; errors: string[] }> {
  if (!isReferralProgramEnabled()) {
    return { sent: 0, skipped: opts.emails.length, errors: ["program_disabled"] };
  }

  const db = createServiceClient();
  const shareUrl = appPath(`/join?ref=${encodeURIComponent(opts.referrerUsername)}`, {
    source: "referral",
    medium: "member",
    campaign: "email_invite",
  });

  const fromName = opts.referrerDisplayName || opts.referrerUsername;
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const email of opts.emails) {
    const normalized = email.toLowerCase();

    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .ilike("email", normalized)
      .maybeSingle();

    if (existingUser) {
      skipped++;
      continue;
    }

    const { error: insertErr } = await db.from("referral_invites").insert({
      referrer_id: opts.referrerId,
      email,
      normalized_email: normalized,
      status: "sent",
    } as never);

    if (insertErr) {
      if (insertErr.code === "23505") {
        skipped++;
        continue;
      }
      errors.push(`${email}: save_failed`);
      continue;
    }

    if (!isEmailConfigured()) {
      errors.push("email_not_configured");
      skipped++;
      continue;
    }

    const discount = refereeDiscountLabel();
    const reward = referrerRewardLabel();
    const ok = await sendPortfuelEmail({
      to: email,
      subject: `${fromName} invited you to PortFuel`,
      text: `${fromName} invited you to join PortFuel — a member workspace for tracked stock and crypto calls.\n\nYour friend is sharing a referral offer: ${discount} on your first month when you activate membership. They earn ${reward} when you subscribe.\n\nJoin: ${shareUrl}\n\nNot investment advice.`,
      html: `<p><strong>${fromName}</strong> invited you to join <strong>PortFuel</strong> — a member workspace for tracked stock and crypto calls.</p>
<p>Referral offer: <strong>${discount}</strong> on your first month when you activate membership. Your friend earns <strong>${reward}</strong> when you subscribe.</p>
<p><a href="${shareUrl}">Join PortFuel</a></p>
<p style="font-size:12px;color:#64748b">Not investment advice.</p>`,
    });

    if (ok) sent++;
    else errors.push(`${email}: send_failed`);
  }

  return { sent, skipped, errors: [...new Set(errors)] };
}
