import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { appPath } from "@/lib/social/app-url";

export type ReferralStats = {
  referralCode: string;
  shareUrl: string;
  signedUp: number;
  converted: number;
};

export type ReferrerPreview = {
  username: string;
  displayName: string;
};

function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function ensureReferralCode(userId: string, username: string): Promise<string> {
  const code = normalizeCode(username);
  const db = createServiceClient();
  const { data: row } = await db
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (row?.referral_code) return row.referral_code as string;

  const { error } = await db.from("users").update({ referral_code: code }).eq("id", userId);
  if (error) {
    console.error("[referrals/ensureReferralCode]", error);
  }
  return code;
}

export async function findReferrerByCode(code: string): Promise<{ id: string; username: string; display_name: string | null } | null> {
  const normalized = normalizeCode(code);
  if (!normalized || normalized.length < 2) return null;

  const db = createServiceClient();
  const { data: byCode } = await db
    .from("users")
    .select("id, username, display_name")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (byCode) {
    return byCode as { id: string; username: string; display_name: string | null };
  }

  const { data: byUsername } = await db
    .from("users")
    .select("id, username, display_name")
    .ilike("username", normalized)
    .maybeSingle();

  return byUsername as { id: string; username: string; display_name: string | null } | null;
}

export async function previewReferrer(code: string): Promise<ReferrerPreview | null> {
  if (isDemoMode()) {
    const normalized = normalizeCode(code);
    if (normalized === "demo" || normalized === "admin") {
      return { username: normalized, displayName: normalized === "admin" ? "Admin" : "Demo Member" };
    }
    return null;
  }

  const referrer = await findReferrerByCode(code);
  if (!referrer) return null;
  return {
    username: referrer.username,
    displayName: referrer.display_name?.trim() || referrer.username,
  };
}

export async function attributeReferral(opts: {
  referrerId: string;
  referredUserId: string;
  referralCode: string;
}): Promise<void> {
  if (opts.referrerId === opts.referredUserId) return;

  const db = createServiceClient();
  const { error: userError } = await db
    .from("users")
    .update({ referred_by_user_id: opts.referrerId })
    .eq("id", opts.referredUserId);

  if (userError) {
    console.error("[referrals/attributeReferral] user update", userError);
    return;
  }

  const { error: refError } = await db.from("user_referrals").insert({
    referrer_id: opts.referrerId,
    referred_user_id: opts.referredUserId,
    referral_code: normalizeCode(opts.referralCode),
    status: "signed_up",
  } as never);

  if (refError && refError.code !== "23505") {
    console.error("[referrals/attributeReferral] insert", refError);
  }
}

export async function markReferralConverted(referredUserId: string): Promise<void> {
  const db = createServiceClient();
  const now = new Date().toISOString();

  const { error } = await db
    .from("user_referrals")
    .update({ status: "converted", converted_at: now })
    .eq("referred_user_id", referredUserId)
    .eq("status", "signed_up");

  if (error) {
    console.error("[referrals/markReferralConverted]", error);
  }
}

export async function fetchReferralStats(userId: string, username: string): Promise<ReferralStats> {
  if (isDemoMode()) {
    const code = normalizeCode(username);
    return {
      referralCode: code,
      shareUrl: appPath(`/join?ref=${encodeURIComponent(code)}`, {
        source: "referral",
        medium: "member",
        campaign: "invite",
      }),
      signedUp: 2,
      converted: 1,
    };
  }

  const code = await ensureReferralCode(userId, username);
  const db = createServiceClient();

  const { data, error } = await db
    .from("user_referrals")
    .select("status")
    .eq("referrer_id", userId);

  if (error) {
    console.error("[referrals/fetchReferralStats]", error);
  }

  const rows = data ?? [];
  const signedUp = rows.length;
  const converted = rows.filter((r) => r.status === "converted").length;

  return {
    referralCode: code,
    shareUrl: appPath(`/join?ref=${encodeURIComponent(code)}`, {
      source: "referral",
      medium: "member",
      campaign: "invite",
    }),
    signedUp,
    converted,
  };
}
